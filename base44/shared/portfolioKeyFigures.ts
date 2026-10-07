export function portfolioStatusRollups(rows) {
  const groups=new Map();
  for(const row of rows) {const key=row.status ?? null;groups.set(key,{status:key,count:(groups.get(key)?.count || 0)+row.count});}
  return [...groups.values()];
}
export async function portfolioFinancialFigures(entities,query,actions,now) {
  const delivery=await entities.ProjectDelivery.aggregate({query,groupBy:['project_id','updated_date','forecast_pc','original_pc'],sum:'contract_sum',max:'pc_achieved',limit:1000});
  const fees=await entities.FeeProposal.aggregate({query,groupBy:['project_id','is_current','revision_number','id'],sum:'fee_value',limit:1000});
  if(delivery.truncated || fees.truncated) throw new Error('Portfolio key figures exceeded their reporting limit.');
  const latest=new Map(),current=new Map(),flags=new Map(),today=now.slice(0,10);
  const flag=(id,high)=>flags.set(id,Boolean(flags.get(id) || high));
  for(const row of delivery.rows) {const old=latest.get(row.project_id);if(!old || String(row.updated_date || '')>String(old.updated_date || ''))latest.set(row.project_id,row);}
  for(const row of fees.rows) {const old=current.get(row.project_id);if(!old || (row.is_current && !old.is_current) || (row.is_current===old.is_current && (Number(row.revision_number) || 0)>(Number(old.revision_number) || 0)))current.set(row.project_id,row);}
  for(const row of actions)if(row.status!=='done' && row.due_date && row.due_date.slice(0,10)<today)flag(row.project_id,row.priority==='high');
  for(const row of latest.values()) {
    if(!row.max_pc_achieved && row.forecast_pc && row.forecast_pc.slice(0,10)<today)flag(row.project_id,true);
    if(!row.max_pc_achieved && row.original_pc && row.forecast_pc && row.forecast_pc.slice(0,10)>row.original_pc.slice(0,10))flag(row.project_id,false);
  }
  return {contractValue:[...latest.values()].reduce((n,row)=>n+(row.sum_contract_sum || 0),0),feeValue:[...current.values()].reduce((n,row)=>n+(row.sum_fee_value || 0),0),atRisk:flags.size,highRisk:[...flags.values()].filter(Boolean).length};
}