import React from 'react';
import fullName from '@/components/data/fullName';
export default function MeetingPeopleSummary({session}) {
 const hosts=session.meeting_hosts || [{name:session.author_name || 'Not recorded'}];
 return <div className="space-y-1 text-xs text-muted-foreground"><p>Hosts: {hosts.map(person=>fullName(person.name,person.id)).join(', ')}</p><p>Attendees: {session.meeting_attendees?.length ? session.meeting_attendees.map(person=>fullName(person.name,person.id)).join(', ') : 'None recorded'}</p></div>;
}