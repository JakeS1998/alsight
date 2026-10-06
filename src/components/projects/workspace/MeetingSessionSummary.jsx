import React from 'react';
import {Button} from '@/components/ui/button';
import useMeetingSessionData from '@/components/projects/workspace/useMeetingSessionData';
import MeetingSessionEvents from '@/components/projects/workspace/MeetingSessionEvents';
import ReviewQueryState from '@/components/projects/workspace/ReviewQueryState';
import {meetingSummaryText,meetingHost} from '@/components/projects/workspace/meetingSessionActivity';
export default function MeetingSessionSummary({session,user,onResume,busy=false,error=''}) {
 const data=useMeetingSessionData(session,user);
 return <ReviewQueryState query={data.query}><div className="space-y-5"><p className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">{data.query.data?.end?.description || meetingSummaryText(session,data.counts,null)}</p>{meetingHost(session,user) && onResume && <Button disabled={busy} onClick={()=>onResume(session)}>{busy ? 'Resuming…' : data.ended ? 'Resume ended meeting' : 'Resume meeting'}</Button>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<h3 className="text-sm font-semibold">Recorded reviews, actions and notes</h3><MeetingSessionEvents session={session} user={user}/></div></ReviewQueryState>;
}