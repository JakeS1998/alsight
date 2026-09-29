import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import StakeholderReportTable from '@/components/framework/StakeholderReportTable';

export default function StakeholderFrameworkReports() {
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
    let active = true;
    setLoading(true); setError('');
    base44.functions.invoke('getStakeholderFrameworkReport', { term, stage, page })
      .then(({ data: next }) => { if (active) { setRows(previous => page ? [...previous, ...next.rows] : next.rows); setData(next); } })
      .catch(() => { if (active) setError('Unable to load the report. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [term, stage, page, revision]);
  const changeStage = value => { setRows([]); setPage(0); setStage(value); setRevision(n => n + 1); };
  return <div className="space-y-6">
    <div><h1 className="font-heading text-2xl font-bold text-als-navy">Framework reports</h1><p className="text-sm text-slate-500">UK Leisure Framework · project milestones and delivery outcomes</p></div>
    {data && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{[['Projects', data.total], ['Questionnaires', data.questionnaire], ['Agreements signed', data.agreement], ['Call-offs dated', data.calloff], ['Delivery outcomes', data.outcomes]].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-xl font-semibold">{value ?? 0}</p></div>)}</div>}
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"><form onSubmit={e => { e.preventDefault(); setRows([]); setPage(0); setTerm(search.trim()); setRevision(n => n + 1); }} className="flex min-w-[230px] flex-1 flex-col gap-1.5"><label htmlFor="stakeholder-search" className="text-sm font-medium">Find a framework project</label><div className="flex gap-2"><input id="stakeholder-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Site, client or FW3 reference" className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm" /><button className="rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">Search</button></div></form><div className="flex flex-col gap-1.5"><label htmlFor="stakeholder-stage" className="text-sm font-medium">Milestone reached</label><select id="stakeholder-stage" value={stage} onChange={e => changeStage(e.target.value)} className="h-10 rounded-lg border border-slate-300 px-3 text-sm"><option value="all">Any milestone</option><option value="pq_date">Questionnaire dated</option><option value="aa_signed">Agreement signed</option><option value="calloff_date">Call-off dated</option><option value="completed_on_time">Delivery outcome recorded</option></select></div>{(term || stage !== 'all') && <button type="button" onClick={() => { setSearch(''); setTerm(''); changeStage('all'); }} className="h-10 rounded-lg border border-slate-300 px-3 text-sm">Clear filters</button>}</div>
    <p className="text-sm text-slate-500">{loading ? 'Loading results…' : `${rows.length} of ${data?.count ?? 0} matching projects shown`}</p>
    {error && <div role="alert" className="rounded-lg border border-destructive p-4 text-sm">{error} <button type="button" onClick={() => setRevision(n => n + 1)} className="font-semibold underline">Try again</button></div>}
    {rows.length > 0 ? <StakeholderReportTable rows={rows} /> : !loading && !error && <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">No framework projects match these filters.</p>}
    {!error && !loading && rows.length < (data?.count ?? 0) && <button type="button" onClick={() => setPage(n => n + 1)} disabled={loading} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm disabled:opacity-50">{loading ? 'Loading…' : 'Load more'}</button>}
  </div>;
}