export async function ieDashboardBreakdown(db,scope){
 const result=await db.IEEngagement.aggregate({query:scope,groupBy:['status','category_id','owner_id','client_id'],limit:1000});
 if(result.truncated)throw new Error('The I&E dashboard grouping limit was reached.');
 const statuses={},services={};let total=0,unassigned=0,clientLinked=0;
 for(const row of result.rows){
  const count=Number(row.count)||0;
  total+=count;statuses[row.status]=(statuses[row.status]||0)+count;
  const service=row.category_id||'';services[service]=(services[service]||0)+count;
  if(!row.owner_id)unassigned+=count;
  if(row.client_id)clientLinked+=count;
 }
 return {total,unassigned,clientLinked,statusCounts:statuses,statuses:Object.entries(statuses).map(([status,count])=>({status,count})),services:Object.entries(services).map(([id,count])=>({id,count}))};
}