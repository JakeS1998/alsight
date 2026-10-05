import React from 'react';
import {Button} from '@/components/ui/button';
import useMeetingSessionData from '@/components/projects/workspace/useMeetingSessionData';
import MeetingSessionEvents from '@/components/projects/workspace/MeetingSessionEvents';
import ReviewQueryState from '@/components/projects/workspace/ReviewQueryState';
import {meetingSummaryText,meetingWriter} from '@/components/projects/workspace/meetingSessionActivity';
export default function MeetingSessionSummary({session,user,onResume}) {
 const data=useMeetingSessionData(session,user);
 return <ReviewQueryState query={data.query}><div className="space-y-5"><p className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">{data.query.data?.end?.description || meetingSummaryText(session,data.counts,null)}</p>{!data.ended && session.owner_id===user.id && meetingWriter(user) && onResume && <Button onClick={()=>onResume(session)}>Resume meeting</Button>}<h3 className="text-sm font-semibold">Recorded reviews, actions and notes</h3><MeetingSessionEvents session={session} user={user}/></div></ReviewQueryState>;
}