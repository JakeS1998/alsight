const blank=field=>({$or:[{[field]:{$exists:false}},{[field]:null},{[field]:''}]});
const dateLabel=value=>new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',day:'numeric',month:'short',year:'numeric'}).format(new Date(value));
export async function todayDocumentBriefing(base44,identities,day,end) {
 const db=base44.entities,sources=['LegalDocument','DMA','JCT'].flatMap(entity=>['signing','drafting'].map(category=>({entity,category,field:category==='signing' ? 'signing_target_date' : 'drafting_due_date'})));
 const pages=[];
 for(let start=0;start<sources.length;start+=3){
  pages.push(...await Promise.all(sources.slice(start,start+3).map(async source=>{
   const query={status:{$ne:'inactive'},bsm_aad_id:{$in:identities},is_bsm_document_owner:{$ne:false},[source.field]:{$regex:'\\S',$lt:source.category==='signing' ? day : `${end}T23:59:59.999Z`},$and:[blank('date_of_execution'),...(source.category==='drafting' ? [blank('drafted_date')] : [])]};
   const [total,page]=await Promise.all([db[source.entity].count(query),db[source.entity].filter(query,{sort:source.field,limit:3,fields:['document_id','document_type','project_id',source.field]})]);
   return {source,total,rows:page.items};
  })));
 }
 const totals={drafting:0,signing:0};
 for(const page of pages)totals[page.source.category]+=page.total;
 const entries=['signing','drafting'].flatMap(category=>pages.filter(page=>page.source.category===category).flatMap(page=>page.rows.map(record=>({record,source:page.source}))).sort((a,b)=>String(a.record[a.source.field]).localeCompare(String(b.record[b.source.field]))).slice(0,3));
 const refs=[...new Set(entries.map(({record})=>record.project_id).filter(Boolean))];
 const projects=refs.length ? (await db.Project.filter({$or:[{id:{$in:refs}},{dataverse_id:{$in:refs}}]},{limit:12,fields:['name','dataverse_id']})).items : [];
 const names=new Map(projects.flatMap(project=>[project.id,project.dataverse_id].filter(Boolean).map(id=>[id,project])));
 const items=entries.map(({record,source})=>{
  const project=names.get(record.project_id),due=record[source.field],overdue=due.slice(0,10)<day;
  const type=source.entity==='DMA' ? 'Development agreement' : source.entity==='JCT' ? 'JCT contract' : String(record.document_type || 'Legal document').replaceAll('_',' ');
  return {key:`document-${source.category}-${source.entity}-${record.id}`,priority:true,severity:overdue ? 'urgent' : due.slice(0,10)===day ? 'attention' : 'upcoming',title:`${type}${project ? ` · ${project.name}` : record.document_id ? ` · ${record.document_id}` : ''}`,detail:`${source.category==='signing' ? 'Signing overdue' : overdue ? 'Drafting overdue' : 'Drafting due'}: ${dateLabel(due)}${record.document_id ? ` · ${record.document_id}` : ''}`,to:project ? `/projects/${project.id}?tab=drafting` : '/documents',label:source.category==='signing' ? 'Review signing' : 'Review drafting'};
 });
 return {items,totals};
}