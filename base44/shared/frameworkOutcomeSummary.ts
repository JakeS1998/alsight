export async function frameworkOutcomeSummary(source,scope,internal) {
 const result=await source.aggregate({query:scope,groupBy:['completed_on_time','completed_to_budget','zero_riddor','riddor_incidents'],limit:1000,...(internal ? {sum:['calloff_value','access_fee']} : {})});
 if(result.truncated)throw new Error('Framework outcome summary exceeded its reporting limit.');
 const summary={total:0,outcomes:0,review:0,onTime:0,onTimeRecorded:0,toBudget:0,budgetRecorded:0,safe:0,safetyRecorded:0,...(internal ? {totalCallOffValue:0,totalUKLFFees:0} : {})};
 for(const row of result.rows || []) {
  const count=row.count || 0;
  const time=['Y','N'].includes(row.completed_on_time),budget=['Y','N'].includes(row.completed_to_budget),safety=['Y','N'].includes(row.zero_riddor);
  const recorded=time || budget || safety;
  summary.total+=count;
  if(recorded)summary.outcomes+=count;
  if(row.completed_on_time==='N' || row.completed_to_budget==='N' || row.zero_riddor==='N' || row.riddor_incidents>0)summary.review+=count;
  if(row.completed_on_time==='Y')summary.onTime+=count;
  if(time)summary.onTimeRecorded+=count;
  if(row.completed_to_budget==='Y')summary.toBudget+=count;
  if(budget)summary.budgetRecorded+=count;
  if(recorded && row.zero_riddor==='Y')summary.safe+=count;
  if(recorded && safety)summary.safetyRecorded+=count;
  if(internal){summary.totalCallOffValue+=row.sum_calloff_value || 0;summary.totalUKLFFees+=row.sum_access_fee || 0;}
 }
 return summary;
}