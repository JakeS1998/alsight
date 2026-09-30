import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { INTERNAL_ROLES } from '@/lib/portal';
import FrameworkVisualSummary from '@/components/framework/FrameworkVisualSummary';
import FrameworkReportRows from '@/components/framework/FrameworkReportRows';

export default function UKLFReports() {
  const { user } = useAuth();
  const internal = INTERNAL_ROLES.includes(user?.role);
  const allowed = internal || user?.role === 'framework_stakeholder';
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [stage, setStage] = useState('all');
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!allowed) return;
    let active = true;
    setLoading(true); setError('');
    base44.functions.invoke('getStakeholderFrameworkReport', { term, stage, page })
      .then(({ data: next }) => { if (active) { setRows(previous => page ? [...previous, ...next.rows] : next.rows); setData(next); } })
      .catch(() => { if (active) setError('Unable to load the report. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [term, stage, page, revision, allowed]);
  const apply = (nextTerm, nextStage) => {
    setRows([]); setPage(0); setTerm(nextTerm); setStage(nextStage); setRevision(n => n + 1);
  };
  if (!allowed) return <p className="p-6 text-slate-500">Framework reporting is available to UKLF stakeholders and the internal team.</p>;
  return <div className="space-y-6">
    <div><h1 className="font-heading text-2xl font-bold text-als-navy">UKLF</h1><p className="text-sm text-slate-500">UK Leisure Framework · project milestones and delivery outcomes</p></div>
    <FrameworkVisualSummary data={data} />
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <form onSubmit={e => { e.preventDefault(); apply(search.trim(), stage); }} className="flex min-w-[230px] flex-1 flex-col gap-1.5"><label htmlFor="framework-search" className="text-sm font-medium">Find a framework project</label><div className="flex gap-2"><input id="framework-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Site, client, FW3 or PROJ reference" className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm" /><button className="rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">Search</button></div></form>
      <div className="flex flex-col gap-1.5"><label htmlFor="framework-stage" className="text-sm font-medium">Milestone reached</label><select id="framework-stage" value={stage} onChange={e => apply(term, e.target.value)} className="h-10 rounded-lg border border-slate-300 px-3 text-sm"><option value="all">Any milestone</option><option value="pq_date">Questionnaire dated</option><option value="aa_signed">Agreement signed</option><option value="calloff_date">Call-off dated</option><option value="completed_on_time">Delivery outcome recorded</option></select></div>
      {(term || stage !== 'all') && <button type="button" onClick={() => { setSearch(''); apply('', 'all'); }} className="h-10 rounded-lg border border-slate-300 px-3 text-sm">Clear filters</button>}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold text-slate-900">Project records</h2><p className="text-sm text-slate-500">{loading ? 'Loading results…' : `${rows.length} of ${data?.count ?? 0} matching records shown`}</p></div>
    {error && <p role="alert" className="rounded-lg border border-destructive bg-white p-4 text-sm text-destructive">{error} <button type="button" onClick={() => setRevision(n => n + 1)} className="font-semibold underline">Try again</button></p>}
    {rows.length ? <FrameworkReportRows rows={rows} internal={internal} /> : !loading && !error && <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">No framework projects match these filters.</p>}
    {!loading && !error && rows.length < (data?.count ?? 0) && <button type="button" onClick={() => setPage(n => n + 1)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm">Load more</button>}
  </div>;
}