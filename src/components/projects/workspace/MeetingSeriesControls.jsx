import React,{useEffect,useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '@/components/ui/dialog';
import MeetingSeriesPicker from '@/components/projects/workspace/MeetingSeriesPicker';
import MeetingSeriesSessions from '@/components/projects/workspace/MeetingSeriesSessions';
import MeetingPeopleEditor from '@/components/projects/workspace/MeetingPeopleEditor';
import MeetingPeopleSummary from '@/components/projects/workspace/MeetingPeopleSummary';
import MeetingOperationContext from '@/components/projects/workspace/MeetingOperationContext';
import MeetingCarryOver from '@/components/projects/workspace/MeetingCarryOver';
import ReviewQueryState from '@/components/projects/workspace/ReviewQueryState';
import {meetingHost} from '@/components/projects/workspace/meetingSessionActivity';

export default function MeetingSeriesControls({manager,user,onSummary}) {
 const [selected,setSelected]=useState(null),[dialog,setDialog]=useState(null),cache=useQueryClient();
 const {session,busy,operations}=manager;
 const meetingId=session ? session.meeting_series_id : selected;
 useEffect(()=>{if(session?.meeting_series_id)setSelected(session.meeting_series_id);},[session?.meeting_series_id]);
 const queryKey=['meeting-series',user.id,user.role,'detail',meetingId];
 const query=useQuery({queryKey,enabled:!!meetingId,queryFn:()=>base44.entities.CRMActivity.get(meetingId)});
 const meeting=query.data?.next_action==='meeting_series' ? query.data : null;
 const locked=busy || !!operations || !!manager.pendingRecords.length;
 const pick=row=>{setSelected(row.id);cache.setQueryData(['meeting-series',user.id,user.role,'detail',row.id],row);setDialog(null);};
 return <div className="space-y-2">
  {!session && !meetingId && !manager.current.isFetching && <MeetingSeriesPicker manager={manager} user={user} onSelect={pick}/>}
  {meetingId && <div className="flex flex-wrap items-center gap-2">
   {!session && <Button size="sm" variant="ghost" disabled={locked} onClick={()=>setSelected(null)}>All meetings</Button>}
   {!session && meetingId && <ReviewQueryState query={query}><strong className="text-sm">{meeting?.subject}</strong></ReviewQueryState>}
   <Button size="sm" variant="outline" disabled={locked} onClick={()=>setDialog('sessions')}>Sessions</Button>
   {!session && meetingHost(meeting,user) && <><Button size="sm" variant="outline" disabled={locked} onClick={()=>setDialog('people')}>Meeting hosts and attendees</Button><Button size="sm" disabled={locked} onClick={async()=>{const row=await manager.start(meeting);if(row?.meeting_previous_at)setDialog('carry');}}>{busy ? 'Opening…' : 'Start new session'}</Button></>}
   {session?.meeting_previous_at && manager.opened && <Button size="sm" variant="outline" disabled={locked} onClick={()=>setDialog('carry')}>Session carry-over</Button>}
  </div>}
  {!session && meeting && <MeetingPeopleSummary session={meeting}/>}
  <Dialog open={!!dialog} onOpenChange={open=>{if(!open && !operations)setDialog(null);}}><DialogContent className="max-h-[85dvh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{dialog==='sessions' ? 'Meeting sessions' : dialog==='people' ? 'Meeting hosts and attendees' : 'Session carry-over'}</DialogTitle><DialogDescription>{dialog==='sessions' ? 'Choose a dated session to view its summary or open it.' : dialog==='people' ? 'These people will be included in future sessions.' : 'Review what carried forward from earlier sessions in this meeting.'}</DialogDescription></DialogHeader>
   {dialog==='sessions' && meetingId && <MeetingSeriesSessions key={meetingId} meetingId={meetingId} user={user} onSelect={row=>{setDialog(null);onSummary(row);}}/>}
   {dialog==='people' && meeting && <MeetingOperationContext.Provider value={manager.operationContext}><MeetingPeopleEditor session={meeting} onSaved={row=>{pick(row);cache.invalidateQueries({queryKey:['meeting-series']});}}/></MeetingOperationContext.Provider>}
   {dialog==='carry' && session && <MeetingOperationContext.Provider value={manager.operationContext}><MeetingCarryOver key={session.id} session={session} user={user} manager={manager}/></MeetingOperationContext.Provider>}
  </DialogContent></Dialog>
 </div>;
}