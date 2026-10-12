import React from 'react';
import MeetingSessionEvents from '@/components/projects/workspace/MeetingSessionEvents';
import MeetingFollowUpActions from '@/components/projects/workspace/MeetingFollowUpActions';
export default function MeetingReferenceView({session,user,manager}) {
 return <div className="space-y-6 p-4"><div><h2 className="font-semibold">{session.subject}</h2><p className="mt-1 text-sm text-muted-foreground">Read-only meeting reference. Browse recorded notes, reviews and actions without changing the meeting.</p></div><section className="space-y-3"><h3 className="text-sm font-semibold">Recorded notes and meeting activity</h3><MeetingSessionEvents session={session} user={user}/></section><section className="space-y-3"><h3 className="text-sm font-semibold">Outstanding meeting actions</h3><MeetingFollowUpActions session={session} user={user} manager={manager} readOnly/></section></div>;
}