import { base44 } from '@/api/base44Client';
import { legalDocumentName, dmaName, jctName } from '@/components/documents/documentNames';
import { plannerDay } from '@/components/dashboard/plannerDates';
import { formatDate } from '@/lib/portal';
import assignedRoles from '@/components/data/assignedRoles';
export function roleAgendaSources(user, identities, day) {
 const end=new Date(`${day}T12:00:00Z`);end.setUTCDate(end.getUTCDate()+7);
 const window={$gte:day,$lt:end.toISOString().slice(0,10)};
 const roles=assignedRoles(user),sources=[];
 if(roles.includes('bdm'))sources.push(...[1,2,3,4].map(stage=>({key:`riba${stage}`,entity:'Project',field:`riba${stage}_end`,stage,query:{status:{$ne:'inactive'},live_project:true,bdm_aad_id:{$in:identities},[`riba${stage}_end`]:window},fields:['name','project_number',`riba${stage}_end`]})));
 if(roles.includes('bsm'))sources.push(...['LegalDocument','DMA','JCT'].map(entity=>({key:entity,entity,field:'drafting_due_date',query:{status:{$ne:'inactive'},bsm_aad_id:{$in:identities},is_bsm_document_owner:{$ne:false},drafting_due_date:window,drafted_date:{$in:[null,'']},date_of_execution:{$in:[null,'']}},fields:['document_id','document_type','project_id','drafting_due_date']})));
 return sources;
}
export async function loadRoleAgendaPage(sources, cursors, day) {
 const pages=await Promise.all(sources.map(async source=>({source,page:cursors[source.key]===false ? {items:[],has_more:false} : await base44.entities[source.entity].filter(source.query,{sort:source.field,limit:10,fields:source.fields,...(cursors[source.key] ? {cursor:cursors[source.key]} : {})})})));
 const refs=[...new Set(pages.flatMap(({source,page})=>source.entity==='Project' ? [] : page.items.map(row=>row.project_id)).filter(Boolean))];
 const projects=refs.length ? (await base44.entities.Project.filter({$or:[{id:{$in:refs}},{dataverse_id:{$in:refs}}]},{limit:60,fields:['name','project_number','dataverse_id']})).items : [];
 const names=Object.fromEntries(projects.flatMap(project=>[project.id,project.dataverse_id].filter(Boolean).map(id=>[id,project])));
 const rows=pages.flatMap(({source,page})=>page.items.map(row=>{
  const project=source.entity==='Project' ? row : names[row.project_id],date=plannerDay(row[source.field]);
  const document=source.entity==='LegalDocument' ? legalDocumentName(row,project?.name,null,project?.project_number) : source.entity==='DMA' ? dmaName(project?.name,project?.project_number) : jctName(project?.name);
  return {key:`role-${source.key}-${row.id}`,kind:'role',title:source.stage ? `Review RIBA ${source.stage} completion · ${row.name}` : `Draft ${document}`,detail:`${source.stage ? 'Stage ending' : 'Drafting due'} ${formatDate(row[source.field])}${row.document_id ? ` · ${row.document_id}` : ''}`,time:date===day ? 'Today' : new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB',{day:'numeric',month:'short'}),sort:`${date}T00:00`,to:project ? `/projects/${project.id}?tab=${source.stage ? 'timeline' : 'drafting'}` : '/documents'};
 }));
 const next=Object.fromEntries(pages.map(({source,page})=>[source.key,page.has_more ? page.next_cursor : false]));
 return {rows,next,more:pages.some(({page})=>page.has_more)};
}