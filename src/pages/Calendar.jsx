import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { addDays, format } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OutlookConnectionPanel from '@/components/outlook/OutlookConnectionPanel';
import useOutlookConnection from '@/components/outlook/useOutlookConnection';
import useCalendarEvents from '@/components/outlook/useCalendarEvents';
import CalendarEventList from '@/components/outlook/CalendarEventList';
import CalendarEventDialog from '@/components/outlook/CalendarEventDialog';
import { initialWeek } from '@/components/outlook/calendarDates';
import { calendarTimeZone } from '@/components/outlook/calendarClient';
export default function Calendar() {
  const [week, setWeek] = useState(initialWeek);
  const connection = useOutlookConnection();
  const calendar = useCalendarEvents(connection.connected, week, connection.refresh);
  const canEdit = connection.calendar?.canEdit !== false;
  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="flex items-center gap-3 font-heading text-2xl font-semibold"><CalendarDays className="text-primary" />My calendar</h1><p className="mt-1 text-sm text-muted-foreground">Your personal Outlook calendar · {calendarTimeZone}</p></div><Button asChild variant="outline"><Link to="/account-settings">Connection settings</Link></Button></header>
    {connection.loading && <p role="status" className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Checking Outlook…</p>}
    {!connection.loading && !connection.connected && <OutlookConnectionPanel connection={connection} />}
    {connection.error && <p role="alert" className="text-sm text-destructive">{connection.error}</p>}
    {connection.connected && <section className="overflow-hidden rounded-panel border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-5"><div className="flex flex-wrap items-center gap-2"><Button variant="outline" size="icon" aria-label="Previous week" disabled={calendar.loading} onClick={() => setWeek(date => addDays(date, -7))}><ChevronLeft /></Button><Button variant="outline" size="icon" aria-label="Next week" disabled={calendar.loading} onClick={() => setWeek(date => addDays(date, 7))}><ChevronRight /></Button><h2 className="mx-2 font-heading font-semibold">{format(week, 'd MMM')} – {format(addDays(week, 6), 'd MMM yyyy')}</h2><Button variant="ghost" disabled={calendar.loading} onClick={() => setWeek(initialWeek())}>This week</Button></div><div className="flex gap-2"><Button variant="outline" disabled={calendar.loading} onClick={calendar.refresh}><RefreshCw />Refresh</Button><Button disabled={calendar.loading || !canEdit} onClick={() => calendar.setSelected({})}><Plus />New event</Button></div></div>
      {calendar.error && <p role="alert" className="px-5 py-4 text-sm text-destructive">{calendar.error}</p>}
      {calendar.loading && <p role="status" className="flex items-center gap-2 px-5 py-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading your calendar…</p>}
      {!calendar.loading && !calendar.error && !calendar.events.length && <div className="p-12 text-center"><CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><h3 className="font-heading font-semibold">No events this week</h3><p className="mt-1 text-sm text-muted-foreground">Navigate to another week or create an event.</p></div>}
      <CalendarEventList events={calendar.events} onEdit={calendar.edit} disabled={calendar.loading} canEdit={canEdit} />
      {calendar.cursor && <div className="border-t border-border p-4 text-center"><Button variant="outline" disabled={calendar.loading} onClick={calendar.loadMore}>Load more events</Button></div>}
      {!canEdit && <p className="p-5 text-sm text-muted-foreground">This calendar is read-only.</p>}
    </section>}
    {connection.connected && calendar.selected && <CalendarEventDialog key={calendar.selected.id || 'new'} event={calendar.selected} week={week} onClose={() => calendar.setSelected(null)} onSaved={() => { calendar.setSelected(null); calendar.refresh(); }} />}
  </div>;
}