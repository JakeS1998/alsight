import React from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import DashboardPanel from '@/components/dashboard/DashboardPanel';
import { formatDateTime } from '@/lib/portal';
export default function OverviewUpdates({ rows = [], since }) {
  return <DashboardPanel title={since ? 'Since you last checked' : 'Latest portfolio updates'} subtitle={since ? `Since ${formatDateTime(since)}` : 'Most recently updated project records'} link="/projects">{!rows.length ? <p className="py-4 text-xs text-muted-foreground">No project updates in this period.</p> : <ul className="divide-y divide-border/60">{rows.map(p => <li key={p.id}><Link to={`/projects/${p.id}`} className="flex gap-3 py-3 hover:bg-muted/40"><FileText className="mt-1 h-4 w-4 shrink-0 text-chart-2" /><span className="min-w-0"><strong className="block truncate text-[10px]">{p.name}</strong><span className="mt-1 block text-[9px] text-muted-foreground">Project updated · {formatDateTime(p.updated_date)}</span></span></Link></li>)}</ul>}</DashboardPanel>;
}