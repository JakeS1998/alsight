import {outlookBriefingText} from './outlookBriefingText.ts';
export async function outlookMeetingBrief(base44,graph,input){
 if(typeof input.id!=='string'||!input.id||input.id.length>1500||input.notes!==undefined&&(typeof input.notes!=='string'||input.notes.length>4000)||input.projectId!==undefined&&(typeof input.projectId!=='string'||input.projectId.length>100))return Response.json({error:'Choose a meeting and keep notes within 4,000 characters.'},{status:400});
 const event=await graph(`/me/events/${encodeURIComponent(input.id)}?$select=id,subject,start,end,location,attendees,organizer,body,webLink`);
 let project=null,actions=[],moreActions=false;
 if(input.projectId){
  const record=await base44.entities.Project.get(input.projectId);
  if(!record)return Response.json({error:'That project is unavailable.'},{status:403});
  project={id:record.id,name:record.name,client:record.client_name,description:String(record.description||'').slice(0,2000),status:record.status,live:record.live_project,approvalStatus:record.approval_status};
  const page=await base44.entities.ProjectAction.filter({project_id:record.id,status:{$in:['open','in_progress']}},{limit:6,sort:'due_date',fields:['action','owner','due_date','status']});
  actions=page.items;moreActions=page.has_more;
 }
 const evidence={meeting:{subject:event.subject,start:event.start,end:event.end,location:event.location?.displayName,organizer:event.organizer?.emailAddress,attendees:(event.attendees||[]).slice(0,40).map(a=>({name:a.emailAddress?.name,address:a.emailAddress?.address,response:a.status?.response})),invitation:String(event.body?.content||'').slice(0,8000)},project,openProjectActions:actions,moreProjectActions:moreActions,meetingNotes:input.notes||'',limitations:'No transcript, recording, attachment, email thread or unselected project was read. Project matching is selected by the user, not inferred.'};
 const briefing=await outlookBriefingText(base44,'meeting',evidence);
 return Response.json({briefing,project,moreActions,hasNotes:!!input.notes?.trim(),refreshedAt:new Date().toISOString()});
}