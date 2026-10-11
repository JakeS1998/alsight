import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { formatDate } from '@/lib/portal';
export default function CapacityCommitmentRow({row,cutoff}) {
  const events=row.events.filter(event=>event.date<=cutoff);
  const first=events[0];
  return <li className="py-2">
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold" title={row.name}>{row.name}</p>{first && <p className="mt-0.5 truncate text-xs text-muted-foreground">{formatDate(first.date)} · {first.label}</p>}</div>
        <span className="shrink-0 rounded-md bg-secondary px-2 py-1 text-xs" title="Recorded milestones">{events.length} {events.length===1 ? 'milestone' : 'milestones'}</span><ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-open:rotate-180" aria-hidden="true"/>
      </summary>
      <div className="mt-2 space-y-2 rounded-md bg-secondary/50 p-3">
        <Link to={`/projects/${row.id}`} className="text-xs font-semibold text-chart-2 underline">Open {row.name}</Link>
        <p className="text-xs text-muted-foreground">{row.supplierNames?.join(', ') || 'Delivery suppliers not recorded'}</p>
        {events.map(event=><p key={event.label+event.date} className="text-xs">{formatDate(event.date)} · {event.label} <span className="text-muted-foreground">({event.source})</span></p>)}
      </div>
    </details>
  </li>;
}