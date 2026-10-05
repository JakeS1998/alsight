import {base44} from '@/api/base44Client';
export const meetingKey=id=>`Meeting session: ${id}`;
export const meetingWriter=user=>['admin','director','bdm','bsm'].includes(user?.role);
export async function appendMeetingActivity(user,session,event,{project,text,action}={}) {
 return base44.entities.CRMActivity.create({type:event==='meeting_start' ? 'internal_meeting' : 'system',next_action:event,key_points:session.key_points,subject:event==='meeting_start' ? session.subject : `${session.subject} · ${event.replace('meeting_','').replaceAll('_',' ')}`,description:text || '',occurred_at:new Date().toISOString(),owner_id:user.id,author_id:user.id,author_name:user.full_name || user.email,line_manager_id:user.data?.line_manager_id || user.line_manager_id || '',...(project ? {project_id:project.id,account_id:project.client_account_id || ''} : {}),commitments:action?.id || project?.id || ''});
}
export function meetingSummaryText(session,counts,end) {
 return [session.subject,`Started: ${new Date(session.occurred_at).toLocaleString()}`,end ? `Ended: ${new Date(end.occurred_at).toLocaleString()}` : 'In progress',`Host: ${session.author_name || 'Not recorded'}`,`${counts.reviewed} projects reviewed`,`${counts.actions} actions created`,`${counts.completed} actions completed`,`${counts.notes} meeting notes saved`].join('\n');
}