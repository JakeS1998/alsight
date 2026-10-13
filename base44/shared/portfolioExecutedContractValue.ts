import { projectValueAggregate } from './projectValueAggregate.ts';

export function getCallOffFinancialYear(now = new Date().toISOString()) {
  const date = new Date(now);
  const year = date.getUTCFullYear() - (date.getUTCMonth() < 3 ? 1 : 0);
  return { start: `${year}-04-01T00:00:00.000Z`, end: `${year + 1}-04-01T00:00:00.000Z`, label: `FY ${year}/${String(year + 1).slice(-2)}` };
}

export async function portfolioExecutedContractValue(entities, query, now = new Date().toISOString()) {
  const financialYear = getCallOffFinancialYear(now);
  const projects = await entities.Project.aggregate({query, groupBy:['id','dataverse_id'], limit:1000});
  if(projects.truncated) throw new Error('Contract project selection exceeded its reporting limit.');
  const aliases = projects.rows.flatMap(row=>[row.id,row.dataverse_id].filter(Boolean));
  if(!aliases.length) return 0;
  // DMA and FW4 DPA use the same entity. Either project identifier may be stored on an agreement.
  const agreements = await entities.DMA.aggregate({query:{project_id:{$in:aliases},executed:{$regex:'^\\s*yes\\s*$',$options:'i'},date_of_execution:{$gte:financialYear.start,$lt:financialYear.end}},groupBy:'project_id',limit:1000});
  if(agreements.truncated) throw new Error('Executed agreement selection exceeded its reporting limit.');
  const executed = new Set(agreements.rows.map(row=>row.project_id));
  const eligibleIds = projects.rows.filter(row=>executed.has(row.id) || executed.has(row.dataverse_id)).map(row=>row.id);
  if(!eligibleIds.length) return 0;
  const eligible = {...query,id:{$in:eligibleIds}};
  // full_value is maintained from the latest submitted client proposal, falling back to the estimate.
  const result = await projectValueAggregate(entities,{query:eligible,sum:'estimated_value'});
  if(result.truncated) throw new Error('Executed contract value is incomplete.');
  return result.rows[0]?.sum_estimated_value || 0;
}