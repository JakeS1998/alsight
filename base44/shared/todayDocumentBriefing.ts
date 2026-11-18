import { inactiveProjectDocumentScope } from './inactiveProjectDocumentScope.ts';
import { completedWarrantyStatuses } from './handoverWarranties.ts';
const blank=field=>({$or:[{[field]:{$exists:false}},{[field]:null},{[field]:''}]});
const dateLabel=value=>new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',day:'numeric',month:'short',year:'numeric'}).format(new Date(value));
// Documents and DMAs store their record-level BSM lookup; JCTs and warranties have separate lead lookups.
const leads={LegalDocument:'bsm_aad_id',DMA:'bsm_aad_id',JCT:'jct_lead_aad_id'};
export const todayDocumentSources=[...Object.entries(leads).flatMap(([entity,lead])=>['signing','drafting'].map(category=>({entity,lead,category,key:`${category}-${entity}`,reference:'document_id',field:category==='signing' ? 'signing_target_date' : 'drafting_due_date'}))),{entity:'Warranty',lead:'warranty_lead_aad_id',category:'warranties',key:'due-Warranty',reference:'warranty_id',field:'warranty_due'}];
export async function todayDocumentBriefing(base44,identities,day,end,fullPage=null) {
 const db=base44.entities,sources=fullPage ? todayDocumentSources.filter(source=>source.key===fullPage.source) : todayDocumentSources;
 const documentScope=await inactiveProjectDocumentScope(base44);
 const pages=[];
 for(let start=0;start<sources.length;start+=3){
  pages.push(...await Promise.all(sources.slice(start,start+3).map(async source=>{
   const query={...documentScope,status:{$ne:'inactive'},[source.lead]:{$in:identities},...(source.entity==='Warranty' ? {warranty_status:{$nin:completedWarrantyStatuses}} : {executed:{$ne:'yes'}}),[source.field]:{$regex:'\\S',$lt:source.category==='signing' ? day : `${end}T23:59:59.999Z`},$and:[blank('date_of_execution'),...(source.category==='drafting' ? [blank('drafted_date')] : [])]};
   if(fullPage?.deadlineFilter==='overdue')query[source.field].$lt=day;
   if(fullPage?.deadlineFilter==='soon')Object.assign(query[source.field],{$gte:day,$lt:fullPage.cutoff});
   if(fullPage?.deadlineFilter==='later')query[source.field].$gte=fullPage.cutoff;
   const fields=[source.reference,'project_id',source.field,...(source.entity==='LegalDocument'?['document_type']:[])];
   const [total,page]=await Promise.all([fullPage ? 0 : db[source.entity].count(query),db[source.entity].filter(query,{sort:source.field,limit:fullPage ? 20 : 3,fields,...(fullPage?.cursor ? {cursor:fullPage.cursor} : {})})]);
   return {source,total,rows:page.items,nextCursor:page.has_more ? page.next_cursor : null};
  })));
 }
 const totals={drafting:0,signing:0,warranties:0};
 for(const page of pages)totals[page.source.category]+=page.total;
 const entries=['signing','drafting','warranties'].flatMap(category=>pages.filter(page=>page.source.category===category).flatMap(page=>page.rows.map(record=>({record,source:page.source}))).sort((a,b)=>String(a.record[a.source.field]).localeCompare(String(b.record[b.source.field]))).slice(0,fullPage ? 20 : 3));
 const refs=[...new Set(entries.map(({record})=>record.project_id).filter(Boolean))];
 const projects=refs.length ? (await db.Project.filter({$or:[{id:{$in:refs}},{dataverse_id:{$in:refs}}]},{limit:refs.length*2,fields:['name','dataverse_id']})).items : [];
 const names=new Map(projects.flatMap(project=>[project.id,project.dataverse_id].filter(Boolean).map(id=>[id,project])));
 const items=entries.map(({record,source})=>{
  const project=names.get(record.project_id),due=record[source.field],overdue=due.slice(0,10)<day;
  const warranty=source.entity==='Warranty',reference=record[source.reference];
  const type=warranty?'Warranty':source.entity==='DMA'?'Development agreement':source.entity==='JCT'?'JCT contract':String(record.document_type || 'Legal document').replaceAll('_',' ');
  const action=warranty?'Warranty':source.category==='signing'?'Signing':'Drafting';
  return {key:`document-${source.category}-${source.entity}-${record.id}`,due,priority:true,severity:overdue?'urgent':due.slice(0,10)===day?'attention':'upcoming',title:`${type}${project ? ` · ${project.name}` : reference ? ` · ${reference}` : ''}`,detail:`${action} ${overdue?'overdue':'due'}: ${dateLabel(due)}${reference ? ` · ${reference}` : ''}`,to:project ? `/projects/${project.id}?tab=${warranty?'warranties':'drafting'}#document-${record.id}` : warranty?'/warranties':'/documents',label:`Review ${action.toLowerCase()}`};
 });
 return fullPage ? {items,nextCursor:pages[0]?.nextCursor || null} : {items,totals};
}