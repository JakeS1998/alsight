import React from 'react';
export default function MeetingPeopleSummary({session}) {
 const hosts=session.meeting_hosts || [{name:session.author_name || 'Not recorded'}];
 return <div className="space-y-1 text-xs text-muted-foreground"><p>Hosts: {hosts.map(person=>person.name).join(', ')}</p><p>Attendees: {session.meeting_attendees?.length ? session.meeting_attendees.map(person=>person.name).join(', ') : 'None recorded'}</p></div>;
}