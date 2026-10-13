import { projectValueAggregate } from './projectValueAggregate.ts';

export async function portfolioExecutedContractValue(entities, query) {
  const projects = await entities.Project.aggregate({query, groupBy:['id','dataverse_id'], limit:2000});
  if(projects.truncated) throw new Error('Contract project selection exceeded its reporting limit.');
  const aliases = projects.rows.flatMap(row=>[row.id,row.dataverse_id].filter(Boolean));
  if(!aliases.length) return 0;
  // DMA and FW4 DPA use the same entity. Either project identifier may be stored on an agreement.
  const agreements = await entities.DMA.aggregate({query:{project_id:{$in:aliases},status:{$ne:'inactive'},executed:{$regex:'^\\s*yes\\s*$',$options:'i'}},groupBy:'project_id',limit:2000});
  if(agreements.truncated) throw new Error('Executed agreement selection exceeded its reporting limit.');
  const executed = agreements.rows.map(row=>row.project_id);
  if(!executed.length) return 0;
  const eligible = {...query,$or:[{id:{$in:executed}},{dataverse_id:{$in:executed}}]};
  // full_value is maintained from the latest submitted client proposal, falling back to the estimate.
  const result = await projectValueAggregate(entities,{query:eligible,sum:'estimated_value'});
  if(result.truncated) throw new Error('Executed contract value is incomplete.');
  return result.rows[0]?.sum_estimated_value || 0;
}