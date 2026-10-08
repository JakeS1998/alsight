import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ListChecks, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
export default function HomeAgendaRow({ row, onFollowup, onDone }) {
  const Icon = row.kind === 'calendar' ? CalendarDays : row.kind === 'reminder' ? Bell : ListChecks;
  return <li className="flex items-start gap-3 rounded-lg border border-border p-3">
    <span className="w-16 shrink-0 pt-1 text-xs font-semibold text-muted-foreground">{row.time}</span>
    <Icon className="mt-1 h-4 w-4 shrink-0 text-chart-2" />
    <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{row.title}</p><p className="mt-1 text-xs text-muted-foreground">{row.detail}</p><div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
      <span className={row.kind === 'calendar' ? 'rounded bg-primary/10 px-2 py-1 text-foreground' : 'rounded bg-secondary px-2 py-1 text-chart-2'}>{row.kind === 'calendar' ? 'Outlook' : 'ALSight'}</span>
      {row.to && <Link to={row.to} className="font-semibold text-chart-2 hover:underline">Review task</Link>}
      {row.kind === 'calendar' && row.joinUrl && <Button asChild size="sm"><a href={row.joinUrl} target="_blank" rel="noopener noreferrer" aria-label={`Join meeting: ${row.title}`}>Join meeting</a></Button>}
      {row.kind === 'calendar' && row.href && <a href={row.href} target="_blank" rel="noopener noreferrer" className="font-semibold text-chart-2 hover:underline">Open in Outlook</a>}
      {row.kind === 'reminder' && <button disabled={row.busy} onClick={() => onDone(row.id)} className="font-semibold text-chart-2 disabled:opacity-50">{row.busy ? 'Saving…' : 'Done'}</button>}
      <button onClick={() => onFollowup(`Follow up: ${row.title}`)} className="font-semibold text-chart-2 hover:underline">Schedule follow-up</button>
    </div></div>
  </li>;
}