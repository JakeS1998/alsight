import React,{useState} from 'react';
import {Link} from 'react-router-dom';
import MeetingSummaryEmailButton from '@/components/projects/workspace/MeetingSummaryEmailButton';
import {meetingSessionRequest} from '@/components/projects/workspace/meetingSessionClient';
import {Button} from '@/components/ui/button';
import useMeetingSessionData from '@/components/projects/workspace/useMeetingSessionData';
import MeetingSessionEvents from '@/components/projects/workspace/MeetingSessionEvents';
import ReviewQueryState from '@/components/projects/workspace/ReviewQueryState';
import {meetingSummaryText,meetingHost,meetingMember} from '@/components/projects/workspace/meetingSessionActivity';
export default function MeetingSessionSummary({session,user,onResume,busy=false,error='',standalone=false}) {
 const data=useMeetingSessionData(session,user),host=meetingHost(session,user),member=meetingMember(session,user);
 const [working,setWorking]=useState(false),[reopenError,setReopenError]=useState('');
 const changeState=async action=>{setWorking(true);setReopenError('');try{await meetingSessionRequest(action,session.id);await data.query.refetch({throwOnError:true});}catch(e){setReopenError(e.message);}finally{setWorking(false);}};
 return <ReviewQueryState query={data.query}><div className="space-y-5">
  <p className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">{data.query.data?.end?.description || meetingSummaryText(session,data.counts,null)}</p>
  <div className="flex flex-wrap items-start gap-3">
   {member && onResume && host && <Button disabled={busy} onClick={()=>onResume(session)}>{busy ? 'Opening…' : data.ended ? 'Reopen meeting' : 'Open session'}</Button>}
   {member && !standalone && <Button variant="outline" asChild><Link to={`/meeting-sessions/${session.id}`}>Open meeting notes</Link></Button>}
   {host && standalone && <Button disabled={working} onClick={()=>changeState(data.ended ? 'reopen' : 'end')}>{working ? 'Saving…' : data.ended ? 'Reopen meeting' : 'End session'}</Button>}
   {host && data.ended && <MeetingSummaryEmailButton session={session} disabled={busy || working}/>}
  </div>
  {!host && member && <p className="text-sm text-muted-foreground">Read-only: only meeting hosts can reopen the session or edit notes.</p>}
  {(error || reopenError) && <p role="alert" className="text-sm text-destructive">{error || reopenError}</p>}
  <h3 className="text-sm font-semibold">Recorded reviews, actions and notes</h3><MeetingSessionEvents session={session} user={user} editable={host && !data.ended}/>
 </div></ReviewQueryState>;
}