export default async function opportunityASERatingIds(db,query,rating,overdue) {
 if(!['attention','complete','won','lost'].includes(rating))throw new Error('Invalid opportunity ASE rating.');
 const parts=await Promise.all([['id','status','owner_id','contact_id'],['id','expected_decision_date','next_action','fee_status'],['id','stage']].map(groupBy=>db.Opportunity.aggregate({query,groupBy,limit:1000})));
 if(parts.some(p=>p.truncated))throw new Error('Narrow your opportunity filters before selecting an ASE rating.');
 const metadata=new Map();for(const part of parts)for(const row of part.rows)metadata.set(row.id,{...metadata.get(row.id),...row});
 const rows={rows:[...metadata.values()]};
 const ids=rows.rows.map(r=>r.id);
 if(!ids.length)return [];
 const scope={opportunity_id:{$in:ids}},interactions=['call','email','meeting','teams_meeting','client_visit','internal_meeting','lunch','site_visit'];
 const [tasks,activity,conversation]=await Promise.all([
  db.CRMTask.filter({...scope,status:{$in:['open','in_progress']}},{distinct:'opportunity_id',limit:1000}),
  db.CRMActivity.aggregate({query:{...scope,type:{$in:interactions}},groupBy:'opportunity_id',max:'occurred_at',limit:1000}),
  db.Conversation.aggregate({query:scope,groupBy:'opportunity_id',max:'occurred_at',limit:1000}),
 ]);
 if(tasks.has_more || activity.truncated || conversation.truncated)throw new Error('Narrow your opportunity filters before selecting an ASE rating.');
 const withTasks=new Set(tasks.items),late=new Set(overdue),last=new Map(),today=new Date().toISOString().slice(0,10);
 for(const row of [...activity.rows,...conversation.rows])if(row.max_occurred_at && (!last.has(row.opportunity_id) || row.max_occurred_at>last.get(row.opportunity_id)))last.set(row.opportunity_id,row.max_occurred_at);
 return rows.rows.filter(item=>{
  if(item.status!=='open')return rating===item.status;
  const date=last.get(item.id),days=date ? Math.max(0,Math.floor((Date.now()-Date.parse(date))/86400000)) : null;
  const attention=!item.owner_id || !item.contact_id || !item.expected_decision_date || item.expected_decision_date<today || late.has(item.id) || !withTasks.has(item.id) && !item.next_action || days>=21 && days!==null || ['sent','accepted'].includes(item.fee_status) && ['lead','qualified','scope_development','design_feasibility','proposal_preparation'].includes(item.stage);
  return rating===(attention ? 'attention' : 'complete');
 }).map(item=>item.id);
}