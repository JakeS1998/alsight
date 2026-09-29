import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { INTERNAL_ROLES, formatCurrency } from '@/lib/portal';
import FrameworkReportTable from '@/components/framework/FrameworkReportTable';

export default function FrameworkReports() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [stage, setStage] = useState('all');
  const [rows, setRows] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState(null);
  const allowed = INTERNAL_ROLES.includes(user?.role);
  useEffect(() => {
    if (!allowed) return;
    Promise.all([
      base44.entities.FrameworkProjectReport.aggregate({ sum: ['calloff_value', 'completion_value'] }),
      base44.entities.FrameworkProjectReport.count({ project_id: { $gt: '' } }),
    ]).then(([summary, linked]) => setTotals({ ...(summary.rows?.[0] || {}), linked }));
  }, [allowed]);
  const query = () => ({
    ...(term.trim() ? { $or: [{ site: { $regex: term.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }, { framework_ref: { $regex: term.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }, { client: { $regex: term.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }] } : {}),
    ...(stage !== 'all' ? { [stage]: stage === 'completion_value' ? { $gt: 0 } : { $gt: '' } } : {}),
  });
  useEffect(() => {
    if (!allowed) return;
    let active = true;
    setLoading(true);
    base44.entities.FrameworkProjectReport.filter(query(), { sort: '-framework_ref', limit: 50 }).then(page => {
      if (active) { setRows(page.items); setCursor(page.next_cursor); setHasMore(page.has_more); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [term, stage, allowed]);
  const loadMore = async () => {
    setLoading(true);
    try {
      const page = await base44.entities.FrameworkProjectReport.filter(query(), { sort: '-framework_ref', limit: 50, cursor });
      setRows(current => [...current, ...page.items]); setCursor(page.next_cursor); setHasMore(page.has_more);
    } finally { setLoading(false); }
  };
  if (!allowed) return <p className="p-6 text-slate-500">Framework reporting is for the internal team.</p>;
  return <div className="space-y-6">
    <div><h1 className="font-heading text-2xl font-bold text-als-navy">Framework reports</h1><p className="text-sm text-slate-500">FW3 workbook reporting, linked to ALSight where projects match confidently. Existing ALSight data is unchanged.</p></div>
    {totals && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
      ['Framework references', totals.count || 0], ['Linked references', totals.linked || 0],
      ['Call-off value', formatCurrency(totals.sum_calloff_value || 0)], ['Completion value', formatCurrency(totals.sum_completion_value || 0)],
    ].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-xl font-semibold text-slate-900">{value}</p></div>)}</div>}
    <p className="text-xs text-slate-500">Totals sum recorded project rows and may differ from the workbook’s own dashboard totals; no existing ALSight figures were overwritten.</p>
    <div className="flex flex-wrap gap-3"><form onSubmit={e => { e.preventDefault(); setTerm(search); }} className="flex min-w-[230px] flex-1 gap-2"><input aria-label="Search framework projects" placeholder="Search site, client or reference" value={search} onChange={e => setSearch(e.target.value)} className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm" /><button className="rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">Search</button></form><select aria-label="Filter framework stage" value={stage} onChange={e => setStage(e.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="all">All stages</option><option value="pq_date">Questionnaire</option><option value="aa_signed">AA signed</option><option value="calloff_date">Call-off</option><option value="completion_value">Completion recorded</option></select></div>
    {loading && !rows.length ? <p className="py-12 text-center text-sm text-slate-500">Loading framework reports…</p> : rows.length ? <FrameworkReportTable rows={rows} /> : <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">No framework projects match these filters.</p>}
    {hasMore && <button onClick={loadMore} disabled={loading} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm disabled:opacity-50">{loading ? 'Loading…' : 'Load more'}</button>}
  </div>;
}