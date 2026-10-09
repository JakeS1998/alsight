import {completionOutcome} from './uklfCompletion.ts';
export const uklfProjectFields=['name','project_number','dataverse_id','procurement_route','client_name','estimated_value','pq_approval_date','aa_executed_date','practical_completion_date',...[1,2,3,4,5].map(n=>`riba${n}_system_date`),...[1,2,3,4].map(n=>`riba${n}_end`)];
export const projectAliases=project=>[project.id,project.dataverse_id].filter(Boolean);
export const referenceAliases=project=>{const m=/^PROJ0*(\d+)$/i.exec(project.project_number || '');return [...new Set([project.project_number,...(m && Number(m[1])>=600 ? [m[1],`FW3${m[1]}`,`FW3 ${m[1]}`] : [])].filter(Boolean))];};
export const namePattern=value=>'^\\s*'+String(value || '').trim().split(/\s+/).map(word=>word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('\\s+')+'\\s*$';
export function newUKLFRecord(project,milestones=new Map()) {
 const aliases=projectAliases(project),value=field=>aliases.map(id=>milestones.get(id)?.[field]).filter(Boolean).sort().at(-1);
 const record={framework_ref:project.project_number || `ALSight-${project.id}`,project_id:project.id,site:project.name};
 if(project.project_number)record.project_number=project.project_number;
 if(project.client_name)record.client=project.client_name;
 if(Number.isFinite(project.estimated_value))record.indicative_value=project.estimated_value;
 if(project.pq_approval_date){record.pq_date=project.pq_approval_date;record.pq_status='Approved';}
 if(project.aa_executed_date || value('aa_signed'))record.aa_signed=project.aa_executed_date || value('aa_signed');
 if(value('aa_sent'))record.aa_sent=value('aa_sent');
 if(value('calloff_date'))record.calloff_date=value('calloff_date');
 const outcome=completionOutcome(project);if(outcome)record.completed_on_time=outcome;
 return record;
}
export async function uklfCopiedMilestones(db,projects) {
 const ids=[...new Set(projects.flatMap(projectAliases))],states=new Map();if(!ids.length)return states;
 for(const [entity,extra] of [['LegalDocument',{document_type:'access_agreement'}],['DMA',{}]]){
  const page=await db[entity].aggregate({query:{project_id:{$in:ids},status:{$ne:'inactive'},...extra},groupBy:'project_id',max:'date_of_execution',...(entity==='LegalDocument' ? {min:'sent_to_client'} : {}),limit:500});
  if(page.truncated)throw new Error('UKLF source milestones exceed the safe batch limit.');
  for(const row of page.rows)states.set(row.project_id,{...states.get(row.project_id),...(entity==='LegalDocument' ? {aa_signed:row.max_date_of_execution,aa_sent:row.min_sent_to_client} : {calloff_date:row.max_date_of_execution})});
 }
 return states;
}