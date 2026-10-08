import React from 'react';
import { format } from 'date-fns';
import { MapPin, Users, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { eventDay, eventTime } from '@/components/outlook/calendarDates';
export default function CalendarEventList({ events, onEdit, disabled, canEdit }) {
  let previousDay = null;
  return <div>{events.map(event => {
    const day = eventDay(event), heading = day !== previousDay; previousDay = day;
    return <React.Fragment key={event.id}>{heading && <h2 className="border-b border-border bg-muted/60 px-5 py-3 font-heading text-sm font-semibold">{format(new Date(`${day}T12:00:00`), 'EEEE, d MMMM')}</h2>}
      <article className="flex flex-col gap-3 border-b border-border px-5 py-5 last:border-b-0 sm:flex-row sm:items-start">
        <div className="w-36 shrink-0 text-sm font-medium text-muted-foreground">{eventTime(event)}</div>
        <div className="min-w-0 flex-1 space-y-2"><h3 className="font-heading font-semibold break-words">{event.subject || '(No title)'}</h3><div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">{event.location?.displayName && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{event.location.displayName}</span>}{event.attendees?.length > 0 && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{event.attendees.length} attendee{event.attendees.length === 1 ? '' : 's'}</span>}{event.type !== 'singleInstance' && <span>Recurring event</span>}</div>{event.bodyPreview && <p className="line-clamp-2 whitespace-pre-wrap text-sm text-muted-foreground">{event.bodyPreview}</p>}{event.isAllDay && <p className="text-xs text-muted-foreground">Until {format(new Date(event.end.dateTime), 'd MMM')} (exclusive)</p>}</div>
        <div className="flex shrink-0 flex-wrap gap-2">{event.onlineMeeting?.joinUrl && <Button asChild variant="outline" size="sm"><a href={event.onlineMeeting.joinUrl} target="_blank" rel="noopener noreferrer">Join Teams</a></Button>}{canEdit && event.isOrganizer && <Button variant="outline" size="sm" disabled={disabled} onClick={() => onEdit(event)}>Edit</Button>}{event.webLink && <Button asChild variant="ghost" size="sm"><a href={event.webLink} target="_blank" rel="noopener noreferrer"><ExternalLink />Outlook</a></Button>}</div>
      </article>
    </React.Fragment>;
  })}</div>;
}