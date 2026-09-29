import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { stageLabel } from '@/components/crm/crm';
import { formatCurrency } from '@/lib/portal';
import { Button } from '@/components/ui/button';

const query = { status: 'open', stage: { $nin: ['on_hold', 'won', 'lost'] } };

export default function PipelineOpportunityDetail() {
  const [rows, setRows] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async (next = null) => {
    setLoading(true);
    setError('');
    try {
      const page = await base44.entities.Opportunity.filter(query, { sort: '-created_date', limit: 50, ...(next ? { cursor: next } : {}) });
      setRows(current => next ? [...current, ...page.items] : page.items);
      setCursor(page.next_cursor);
      setMore(page.has_more);
    } catch (e) { setError(e.message || 'Could not load opportunities.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  return <div className="border-t border-slate-200 px-5 py-5" id="pipeline-timeline-detail">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-als-navy">Open CRM opportunities</h3><Link to="/crm/opportunities" className="text-sm font-medium text-als-navy underline-offset-2 hover:underline">View all opportunities →</Link></div>
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    {loading && !rows.length ? <p className="mt-4 text-sm text-slate-500">Loading opportunities…</p> : !rows.length && !error ? <p className="mt-4 text-sm text-slate-500">No open opportunities in the pipeline.</p> : <div className="mt-3 max-h-80 divide-y divide-slate-100 overflow-auto">{rows.map(item => <Link key={item.id} to={`/opportunities/${item.id}`} className="flex items-center justify-between gap-3 py-3 text-sm hover:bg-slate-50"><span className="min-w-0"><span className="block font-medium text-slate-900">{item.title}</span><span className="text-xs text-slate-500">{stageLabel(item.stage)} · {item.owner_name || 'Unassigned'}</span></span><span className="shrink-0 font-medium text-slate-800">{formatCurrency(item.budget)}</span></Link>)}</div>}
    {more && <Button variant="outline" size="sm" className="mt-4" disabled={loading} onClick={() => load(cursor)}>{loading ? 'Loading…' : 'Load more'}</Button>}
  </div>;
}