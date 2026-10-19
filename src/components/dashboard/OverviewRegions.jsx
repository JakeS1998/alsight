import React from 'react';
import DashboardPanel from '@/components/dashboard/DashboardPanel';
import { formatCurrency, regionName } from '@/lib/portal';
import useIEHeadlines from '@/components/dashboard/useIEHeadlines';
export default function OverviewRegions({ rows = [], refreshKey }) {
  const { query, enabled } = useIEHeadlines(refreshKey);
  const departments = rows.filter(r => !['Business Support Services', 'Insights & Engagement'].includes(regionName(r.department_id)));
  if (enabled && query.data) departments.push({ department_id: 'Insights & Engagement', sum_estimated_value: query.data.serviceValue, count: query.data.total });
  departments.sort((a, b) => (b.sum_estimated_value || 0) - (a.sum_estimated_value || 0));
  const largest = Math.max(1,...departments.map(r => r.sum_estimated_value || 0));
  return <DashboardPanel title="Portfolio by Department" subtitle="Project values and counts by department; I&E uses total service value across all statuses." link="/projects">{enabled && query.isPending ? <p role="status" className="py-4 text-xs text-muted-foreground">Loading department totals…</p> : enabled && query.error ? <p role="alert" className="py-4 text-xs text-destructive">{query.error.message} <button className="underline" onClick={() => query.refetch()}>Try again</button></p> : !departments.length ? <p className="py-4 text-xs text-muted-foreground">No regional records available.</p> : <ul className="space-y-4">{departments.map(r => <li key={r.department_id || 'none'} className="flex items-center gap-3 text-[10px]"><span className="w-28 shrink-0 truncate" title={regionName(r.department_id) || 'Unassigned'}>{regionName(r.department_id) || 'Unassigned'}</span><span className="h-2.5 flex-1 overflow-hidden rounded-sm bg-muted"><span className="block h-full rounded-sm bg-als-navy-light" style={{width:`${Math.max(2,(r.sum_estimated_value || 0)/largest*100)}%`}} /></span><strong className="w-20 shrink-0 text-right">{formatCurrency(r.sum_estimated_value)}</strong><span className="shrink-0 text-muted-foreground">{r.count} {r.count === 1 ? 'project' : 'projects'}</span></li>)}</ul>}</DashboardPanel>;
}