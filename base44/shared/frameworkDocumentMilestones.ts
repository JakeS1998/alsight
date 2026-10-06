export async function frameworkDocumentMilestones(db,projects) {
 const ids=[...new Set(projects.flatMap(project=>[project.id,project.dataverse_id].filter(Boolean)))];
 const states=new Map();
 if(!ids.length)return states;
 for(const [entity,stage] of [['LegalDocument','agreement'],['DMA','calloff']]) {
  const query={project_id:{$in:ids},status:{$ne:'inactive'},...(entity==='LegalDocument' ? {document_type:'access_agreement'} : {})};
  const result=await db[entity].aggregate({query,groupBy:['project_id','executed'],max:'date_of_execution',limit:1000});
  if(result.truncated)throw new Error('Framework document milestone lookup exceeded its reporting limit.');
  for(const row of result.rows) {
   const state=states.get(row.project_id) || {};
   state[stage]=(state[stage] || false) || row.executed==='yes' || !!row.max_date_of_execution;
   states.set(row.project_id,state);
  }
 }
 return states;
}
export function withFrameworkDocumentMilestones(row,project,states) {
 const aliases=project ? [project.id,project.dataverse_id].filter(Boolean) : [];
 const signed=stage=>{
  const known=aliases.map(id=>states.get(id)).filter(state=>state && stage in state);
  return known.length ? known.some(state=>state[stage]) : null;
 };
 return {...row,milestones:{
  questionnaire:!!(project?.pq_approval_date || row.pq_date),
  agreement:signed('agreement') ?? !!(project?.aa_executed_date || row.aa_signed),
  calloff:signed('calloff') ?? !!row.calloff_date,
  outcome:!!project?.practical_completion_date || [row.completed_on_time,row.completed_to_budget,row.zero_riddor].some(value=>['Y','N'].includes(value)),
 }};
}