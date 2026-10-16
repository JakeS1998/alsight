import {ieScope,ieText,ieEscape,ieAttention,ieToday} from './ieAccess.ts';
export function ieQuery(user,filters={}){
 const parts=[ieScope(user)],search=ieText(filters.search,100);
 for(const field of ['status','client_id','owner_id','category_id','support_type_id','region_id'])if(filters[field])parts.push({[field]:ieText(filters[field],100)});
 if(search)parts.push({$or:['reference','name','client_name'].map(field=>({[field]:{$regex:ieEscape(search),$options:'i'}}))});
 if(filters.mine)parts.push({access_user_ids:user.id});
 if(filters.context==='standalone')parts.push({project_id:'',opportunity_id:''});
 if(filters.context==='project')parts.push({project_id:{$ne:''}});
 if(filters.context==='opportunity')parts.push({opportunity_id:{$ne:''}});
 return {$and:parts};
}
export async function ieSummary(base44,user){
 const db=base44.asServiceRole.entities,scope=ieScope(user),attention={$and:[scope,ieAttention()]},year=ieToday().slice(0,4);
 const [statuses,completed,awaiting,mine,needs,recent]=await Promise.all([
  db.IEEngagement.aggregate({query:scope,groupBy:'status'}),
  db.IEEngagement.count({$and:[scope,{status:'completed',completion_date:{$gte:`${year}-01-01`,$lte:`${year}-12-31`}}]}),
  db.IEEngagement.count(attention),
  db.IEEngagement.filter({$and:[scope,{access_user_ids:user.id,status:{$nin:['completed','cancelled']}}]},{sort:'target_date',limit:5}),
  db.IEEngagement.filter(attention,{sort:'target_date',limit:5}),
  db.IEEngagement.filter(scope,{sort:'-updated_date',limit:5})
 ]);
 const statusCounts=Object.fromEntries(statuses.rows.map(row=>[row.status,row.count]));
 return {active:(statusCounts.planned||0)+(statusCounts.live||0),completed,awaiting,mine:mine.items,needs:needs.items,recent:recent.items,year};
}
export async function ieOptions(base44,user){
 const db=base44.asServiceRole.entities,query=ieScope(user),fields=['client_id','owner_id','region_id'];
 const values=await Promise.all(fields.map(field=>db.IEEngagement.filter(query,{distinct:field,limit:500})));
 const [clients,people]=await Promise.all([
  values[0].items.length?db.Account.filter({id:{$in:values[0].items}},{limit:500,fields:['name']}):{items:[]},
  db.User.filter({role:{$in:['sam','sam_director']}},'full_name',200)
 ]);
 return {clients:clients.items,people:people.map(p=>({id:p.id,name:p.full_name||p.email})),regions:values[2].items.filter(Boolean)};
}