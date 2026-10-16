import {ieScope,ieText,ieError,ieAttention,ieToday} from './ieAccess.ts';
export async function ieTodayFeed(base44,user,input){
 const type=ieText(input.feed,30);if(!['updates','actions','work','finance'].includes(type))ieError('Choose an I&E feed.');
 const db=base44.asServiceRole.entities,scope=ieScope(user),global=Object.keys(scope).length===0;
 let childScope={},limited=false;
 if(!global){const allowed=await db.IEEngagement.filter(scope,{distinct:'id',limit:1000});childScope={engagement_id:{$in:allowed.items}};limited=allowed.has_more;}
 const date=ieToday(),week=new Date(`${date}T00:00:00Z`);week.setUTCDate(week.getUTCDate()+7);
 const since=new Date(Date.now()-7*86400000).toISOString(),financeSummary='Updated engagement finance totals and notes.';
 const options={limit:10,...(input.cursor?{cursor:ieText(input.cursor,4000)}:{})};
 let page,rows;
 if(type==='actions'){
  page=await db.IEEngagement.filter({$and:[scope,ieAttention()]},{...options,sort:'target_date',fields:['name','status','target_date','action_note','awaiting_action','owner_name']});
  rows=page.items.map(r=>({id:r.id,title:r.name,engagementId:r.id,date:r.target_date,detail:[r.awaiting_action?'Awaiting action':'Target date approaching',r.action_note,r.owner_name].filter(Boolean).join(' · ')}));
 }else if(type==='work'){
  page=await db.IEWorkItem.filter({...childScope,status:{$ne:'complete'},due_date:{$gte:'1900-01-01',$lte:week.toISOString().slice(0,10)}},{...options,sort:'due_date',fields:['title','engagement_id','due_date','status','owner_name']});
  rows=page.items.map(r=>({id:r.id,title:r.title,engagementId:r.engagement_id,date:r.due_date,detail:[r.status.replaceAll('_',' '),r.owner_name].filter(Boolean).join(' · ')}));
 }else{
  page=await db.IEEvent.filter({...childScope,occurred_at:{$gte:since},summary:type==='finance'?financeSummary:{$ne:financeSummary}},{...options,sort:'-occurred_at',fields:['engagement_id','engagement_name','summary','actor_name','occurred_at']});
  rows=page.items.map(r=>({id:r.id,title:r.engagement_name||'Engagement',engagementId:r.engagement_id,date:r.occurred_at,detail:[r.summary,r.actor_name].filter(Boolean).join(' · ')}));
 }
 return {items:rows,next_cursor:page.next_cursor,has_more:page.has_more,scope_limited:limited,refreshedAt:new Date().toISOString()};
}