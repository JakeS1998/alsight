import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';
import {withPortalUserNames} from '../../shared/portalUserNames.ts';
import {portalUserSearch} from '../../shared/portalUserSearch.ts';
const hosts=['admin','director','bdm','bsm'];
const staff=[...hosts,'regional_director','finance','project_manager'];
const validId=value=>typeof value==='string' && /^[a-zA-Z0-9_-]{1,64}$/.test(value);
export default async function(req: Request): Promise<Response> {
 try {
  const base44=createClientFromRequest(req),user=await base44.auth.me();
  if(!user)return Response.json({error:'Sign in to manage meeting people.'},{status:401});
  if(!hosts.includes(user.role))return Response.json({error:'Only meeting hosts can manage people and assignments.'},{status:403});
  const input=await req.json();
  if(input.action==='search'){
   if(typeof input.search!=='string' || input.search.length>100 || !['host','attendee','assignee'].includes(input.kind))return Response.json({error:'Invalid staff search.'},{status:400});
   if(input.search.trim().length<2)return Response.json({people:[]});
   const db=base44.asServiceRole.entities;
   const people=await withPortalUserNames(db,await db.User.filter({role:{$in:input.kind==='host' ? hosts : staff},...await portalUserSearch(db,input.search)},'full_name',20));
   return Response.json({people:people.map(person=>({id:person.id,name:person.full_name || person.email,role:person.role}))});
  }
  if(input.action!=='save' || !validId(input.sessionId))return Response.json({error:'Invalid meeting operation.'},{status:400});
  const session=await base44.entities.CRMActivity.get(input.sessionId);
  if(!session || session.next_action!=='meeting_start' || !session.key_points?.startsWith('Meeting session: '))return Response.json({error:'Meeting unavailable.'},{status:404});
  if(session.owner_id!==user.id && !session.meeting_hosts?.some(person=>person.id===user.id))return Response.json({error:'Only this meeting’s hosts can change its people.'},{status:403});
  const ends=await base44.asServiceRole.entities.CRMActivity.filter({key_points:session.key_points,next_action:{$in:['meeting_end','meeting_resume']}},{sort:'-occurred_at',limit:1});
  if(ends.items[0]?.next_action==='meeting_end')return Response.json({error:'Resume this ended meeting before changing its attendees and hosts.'},{status:409});
  if(!Array.isArray(input.hostIds) || !input.hostIds.length || input.hostIds.length>10 || !Array.isArray(input.attendeeIds) || input.attendeeIds.length>50 || [...input.hostIds,...input.attendeeIds].some(id=>!validId(id)) || !input.hostIds.includes(session.owner_id))return Response.json({error:'Select up to 10 hosts and 50 attendees; the original organiser remains a host.'},{status:400});
  const ids=[...new Set([...input.hostIds,...input.attendeeIds])];
  const people=await Promise.all(ids.map(id=>base44.asServiceRole.entities.User.get(id)));
  if(people.some(person=>!person || !staff.includes(person.role)) || people.some(person=>input.hostIds.includes(person.id) && !hosts.includes(person.role)))return Response.json({error:'Choose registered internal staff; hosts need meeting-host permissions.'},{status:400});
  const named=await withPortalUserNames(base44.asServiceRole.entities,people);
  const byId=new Map(named.map(person=>[person.id,{id:person.id,name:person.full_name}]));
  const values={meeting_hosts:[...new Set(input.hostIds)].map(id=>byId.get(id)),meeting_attendees:[...new Set(input.attendeeIds)].map(id=>byId.get(id)),meeting_member_ids:ids};
  const total=await base44.asServiceRole.entities.CRMActivity.count({key_points:session.key_points});
  if(total>5000)return Response.json({error:'This meeting is too large to change its people in one operation.'},{status:400});
  const updated=await base44.asServiceRole.entities.CRMActivity.update(session.id,values);
  for(let i=0;i<10;i++){
   const batch=await base44.asServiceRole.entities.CRMActivity.updateMany({key_points:session.key_points,meeting_member_ids:{$ne:ids}},{$set:{meeting_member_ids:ids}});
   if(!batch.has_more)break;
  }
  return Response.json({session:updated});
 } catch(error){return Response.json({error:error.message || 'Unable to manage meeting people.'},{status:400});}
}