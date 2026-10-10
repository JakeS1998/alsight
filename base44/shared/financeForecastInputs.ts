import { financePOFallbacks } from './financePOFallbacks.ts';
const fields=['estimated_value','submitted_proposal_value','submitted_proposal_id','practical_completion_date','aa_executed_date','construction_term_weeks',...Array.from({length:5},(_,i)=>`riba${i+1}_system_date`),...Array.from({length:4},(_,i)=>`riba${i+1}_end`),...Array.from({length:4},(_,i)=>`riba${i+1}_term_weeks`)];
async function aggregate(entity,options){const result=await entity.aggregate({...options,limit:1000});if(result.truncated)throw new Error('Forecast source grouping exceeded its limit. Narrow the project search; partial totals are not displayed.');return result.rows;}
export async function* forecastInputs(base44,state,search,projectId){
 const db=base44.entities,pattern=search.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const query={...(projectId?{id:projectId}:{}),$or:[{estimated_value:{$gt:0}},{submitted_proposal_value:{$gt:0}}],...(pattern?{$and:[{$or:[{name:{$regex:pattern,$options:'i'}},{project_number:{$regex:pattern,$options:'i'}}]}]}:{})};
 let cursor;
 do{
  // Stream only identity metadata. All monetary values, dates and commitments are aggregated in the database.
  const page=await db.Project.filter(query,{sort:'name',limit:1000,fields:['name','project_number','dataverse_id'],...(cursor?{cursor}:{})});
  if(!page.items.length)return;
  const ids=page.items.map(p=>p.id),aliases=page.items.flatMap(p=>[p.id,p.dataverse_id].filter(Boolean));
  const values=await aggregate(db.Project,{query:{id:{$in:ids}},groupBy:'id',max:fields});
  const deliveries=await aggregate(db.ProjectDelivery,{query:{project_id:{$in:aliases}},groupBy:'project_id',max:['forecast_pc','original_pc','contract_sum','pc_achieved']});
  const proposalIds=values.map(v=>v.max_submitted_proposal_id).filter(Boolean);
  const costs=proposalIds.length?await aggregate(db.FeeProposal,{query:{id:{$in:proposalIds},status:{$in:['sent','negotiation','accepted']}},groupBy:'id',max:'external_cost'}):[];
  const mappings=state?.active_generation?await aggregate(db.FinanceProjectMapping,{query:{dataset_id:state.namespace,project_id:{$in:ids},status:{$in:['automatic','manual']}},groupBy:['source_key','project_id']}):[];
  const keys=mappings.map(m=>m.source_key);
  const actuals=keys.length?await aggregate(db.FinanceDataverseRecord,{query:{namespace:state.namespace,generation:state.active_generation,active:true,project_key:{$in:keys},kind:{$in:['invoices','purchase_orders']}},groupBy:['project_key','kind','has_amount'],sum:'amount'}):[];
  const fallbacks = new Map();
  if (keys.length) for await (const row of financePOFallbacks(db, {namespace:state.namespace,generation:state.active_generation,active:true,project_key:{$in:keys}})) {
   const total = fallbacks.get(row.project_key) || {amount:0,resolved:0,partial:0};
   if (row.valued) total.amount += row.amount;
   if (row.valued && !row.missing) total.resolved++;
   if (row.valued && row.missing) total.partial++;
   fallbacks.set(row.project_key,total);
  }
  for (const row of actuals) if (row.kind==='purchase_orders' && row.has_amount===false) row.count -= fallbacks.get(row.project_key)?.resolved || 0;
  for (const [project_key,total] of fallbacks) actuals.push({project_key,kind:'purchase_orders',has_amount:true,sum_amount:total.amount,count:total.resolved});
  const valueMap=new Map(values.map(v=>[v.id,Object.fromEntries(Object.entries(v).filter(([k])=>k.startsWith('max_')).map(([k,v])=>[k.slice(4),v]))]));
  for(const p of page.items){
   const project={...p,...valueMap.get(p.id)},d=deliveries.find(d=>d.project_id===p.id)||deliveries.find(d=>d.project_id===p.dataverse_id);
   const delivery=d?Object.fromEntries(Object.entries(d).filter(([k])=>k.startsWith('max_')).map(([k,v])=>[k.slice(4),v])):{};
   const proposal=costs.find(c=>c.id===project.submitted_proposal_id),links=mappings.filter(m=>m.project_id===p.id),sourceKeys=new Set(links.map(m=>m.source_key));
   yield {project,delivery,cost:proposal?.max_external_cost,linked:links.length>0,poFallback:links.some(link=>(fallbacks.get(link.source_key)?.resolved||0)>0),actuals:actuals.filter(a=>sourceKeys.has(a.project_key))};
  }
  cursor=page.has_more?page.next_cursor:null;
 }while(cursor);
}