import {journeyStageQueries} from './frameworkWorkspaceRules.ts';
import {frameworkProjectNumber} from './frameworkCommercialValues.ts';
export async function frameworkJourneyValues(source,scope,outcome,groups,byAlias,byNumber,signedProjects) {
 const stages={...journeyStageQueries(outcome),outcome};
 const historical={pq_date:'indicative_value',aa_signed:'aa_value',calloff_date:'calloff_value',outcome:'completion_value'};
 const values={};
 for(const [stage,query] of Object.entries(stages)) {
  const field=historical[stage];
  const result=await source.aggregate({query:{$and:[scope,query]},groupBy:['project_id','project_number','framework_ref'],sum:field,max:field,limit:1000});
  if(result.truncated)throw new Error('Framework stage value calculation exceeded its reporting limit.');
  let total=0,valued=0;const seen=new Set();
  for(const row of result.rows) {
   const project=row.project_id ? byAlias.get(row.project_id) : byNumber.get(frameworkProjectNumber(row.project_number || row.framework_ref));
   const key=project?.id || `${row.project_id || ''}:${row.project_number || ''}:${row.framework_ref}`;
   if(seen.has(key))continue;
   seen.add(key);
   // A recorded call-off date alone is not evidence of a signed DMA/DPA.
   if(stage==='calloff_date' && (!project || ![project.id,project.dataverse_id].some(id=>id && signedProjects.has(id))))continue;
   const known=groups.get(key),value=project ? known?.projectValue : (row[`max_${field}`]==null ? null : row[`sum_${field}`]);
   if(!Number.isFinite(value) || value<0)continue;
   total+=value;valued+=1;
  }
  values[stage]={value:valued ? Math.round(total*100)/100 : null,valuedProjects:valued};
 }
 return values;
}