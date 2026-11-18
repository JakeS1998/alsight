import {createClientFromRequest} from 'npm:@base44/sdk@0.8.54';
import {emailMeetingSummary,meetingDate,meetingSummaryCounts} from '../../shared/meetingSessionSummary.ts';

const validId=value=>typeof value==='string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value);
const missing=error=>[403,404].includes(error.status || error.response?.status) ? null : Promise.reject(error);
const failure=(error,status)=>Response.json({error},{status});

export default async function(req: Request): Promise<Response> {
 try {
  if(req.method!=='POST')return failure('Method not allowed.',405);
  const base44=createClientFromRequest(req),user=await base44.auth.me().catch(error=>error.status===401 ? null : Promise.reject(error));
  if(!user)return failure('Sign in to manage a meeting session.',401);
  const input=await req.json().catch(()=>({}));
  if(!['createSeries','start','reopen','end','addNote','editNote','sendSummary'].includes(input?.action) || (input.action!=='createSeries' && !validId(input.sessionId)))return failure('Choose a valid meeting session operation.',400);
  if(!['admin','director','bdm','bsm'].includes(user.role))return failure('Only this session’s hosts can make changes or email its summary.',403);
  const db=base44.entities,activity=base44.asServiceRole.entities.CRMActivity;
  const now=new Date().toISOString(),writer={author_id:user.id,author_name:user.full_name || user.email,occurred_at:now};
  const newKey=()=>`Meeting session: ${crypto.randomUUID()}`;
  if(input.action==='createSeries'){
   const subject=typeof input.name==='string' ? input.name.trim() : '';
   if(!subject || subject.length>120)return failure('Enter a meeting name of up to 120 characters.',400);
   const session=await activity.create({...writer,subject,type:'system',next_action:'meeting_series',key_points:newKey(),owner_id:user.id,meeting_hosts:[{id:user.id,name:writer.author_name}],meeting_attendees:[],meeting_member_ids:[user.id],line_manager_id:user.data?.line_manager_id || user.line_manager_id || ''});
   return Response.json({session});
  }
  const session=await db.CRMActivity.get(input.sessionId).catch(missing);
  if(session?.next_action!==(input.action==='start' ? 'meeting_series' : 'meeting_start') || !/^Meeting session: [a-f0-9-]{36}$/i.test(session.key_points || ''))return failure('Meeting session unavailable.',404);
  const hostIds=[session.owner_id,...(session.meeting_hosts || []).map(person=>person.id)];
  if(!hostIds.includes(user.id))return failure('Only this session’s hosts can make changes or email its summary.',403);
  const original=(await activity.filter({key_points:session.key_points,next_action:session.next_action},{sort:'created_date',limit:1})).items[0];
  if(original?.id!==session.id)return failure('Meeting session unavailable.',404);
  if(input.action==='start'){
   const latest=(await db.CRMActivity.filter({meeting_series_id:session.id,next_action:'meeting_start'},{sort:'-occurred_at',limit:1})).items[0];
   if(latest){
    const state=(await db.CRMActivity.filter({key_points:latest.key_points,next_action:{$in:['meeting_end','meeting_resume']}},{sort:'-occurred_at',limit:1})).items[0];
    if(state?.next_action!=='meeting_end')return failure('This meeting already has an open session. Open it from Sessions and end it before starting another.',409);
   }
   const row=await activity.create({...writer,subject:session.subject,type:'internal_meeting',next_action:'meeting_start',description:'Project review session started.',key_points:newKey(),owner_id:session.owner_id,line_manager_id:session.line_manager_id || '',meeting_series_id:session.id,...(latest ? {meeting_previous_at:latest.occurred_at} : {}),meeting_hosts:session.meeting_hosts || [],meeting_attendees:session.meeting_attendees || [],meeting_member_ids:session.meeting_member_ids || [session.owner_id]});
   return Response.json({session:row});
  }
  const lifecycle=(await db.CRMActivity.filter({key_points:session.key_points,next_action:{$in:['meeting_end','meeting_resume']}},{sort:'-occurred_at',limit:1})).items[0];
  const closed=lifecycle?.next_action==='meeting_end';
  if(input.action==='sendSummary')return closed ? await emailMeetingSummary(base44,user,session,lifecycle) : failure('End the session before emailing its summary.',409);
  const scope={key_points:session.key_points,owner_id:session.owner_id,line_manager_id:session.line_manager_id || '',meeting_member_ids:[...new Set([...hostIds,...(session.meeting_attendees || []).map(person=>person.id)].filter(Boolean))],...(session.meeting_series_id ? {meeting_series_id:session.meeting_series_id} : {})};
  if(input.action==='reopen' || input.action==='end'){
   if((input.action==='reopen' && !closed) || (input.action==='end' && closed))return Response.json({success:true});
   const reopening=input.action==='reopen';
   let description='Session reopened by a host. Previous reviews, actions and notes retained.';
   if(!reopening){
    const c=await meetingSummaryCounts(db,session.key_points);
    description=[session.subject,`Started: ${meetingDate(session.occurred_at)}`,`Ended: ${meetingDate(now)}`,`Hosts: ${(session.meeting_hosts || []).map(person=>person.name).join(', ') || session.author_name || 'Not recorded'}`,`Attendees: ${(session.meeting_attendees || []).map(person=>person.name).join(', ') || 'None recorded'}`,`${c.reviewed} projects reviewed`,`${c.actions} actions created`,`${c.completed} actions completed`,`${c.notes} meeting notes saved`].join('\n');
   }
   await activity.create({...scope,...writer,type:'system',next_action:reopening ? 'meeting_resume' : 'meeting_end',subject:`${session.subject} · ${reopening ? 'reopened' : 'ended'}`,description});
   return Response.json({success:true});
  }
  if(closed)return failure('Reopen this session before changing its notes.',409);
  const note=typeof input.note==='string' ? input.note.trim() : '';
  if(!note || note.length>4000)return failure('Enter a note of up to 4,000 characters.',400);
  if(input.action==='editNote'){
   if(!validId(input.noteId))return failure('Choose a valid meeting note.',400);
   const row=await db.CRMActivity.get(input.noteId).catch(missing);
   if(row?.next_action!=='meeting_note' || row.key_points!==session.key_points)return failure('Meeting note unavailable.',404);
   await activity.update(row.id,{description:note});
  } else {
   if(!validId(input.projectId))return failure('Choose a valid project.',400);
   const project=await db.Project.get(input.projectId).catch(missing);
   if(!project)return failure('Project unavailable.',404);
   await activity.create({...scope,...writer,project_id:project.id,account_id:project.client_account_id || '',type:'project_meeting',next_action:'meeting_note',subject:`Project meeting note · ${project.name}`,description:note});
  }
  return Response.json({success:true});
 }catch(error){console.error('Meeting session operation failed',error.status || error.name);return failure('Unable to complete this meeting session operation.',500);}
}