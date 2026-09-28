import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/portal';
import { STAGES } from '@/components/crm/crm';

const activeStages = STAGES.filter(stage => !['on_hold', 'won', 'lost'].includes(stage.value));

export default function OpportunityPipelineSummary({ detailed = false }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    base44.entities.Opportunity.aggregate({ query: { status: 'open', stage: { $nin: ['on_hold', 'won', 'lost'] } }, groupBy: 'stage', sum: ['budget', 'weighted_value'] })
      .then(result => {
        if (!active) return;
        const byStage = Object.fromEntries(activeStages.map(stage => [stage.value, { stage: stage.label, count: 0, value: 0, weighted: 0 }]));
        (result.rows || []).forEach(entry => {
          const key = entry.stage || 'lead';
          if (!byStage[key]) return;
          byStage[key].count += entry.count || 0;
          byStage[key].value += entry.sum_budget || 0;
          byStage[key].weighted += entry.sum_weighted_value || 0;
        });
        setRows(Object.values(byStage));
      })
      .catch(e => { if (active) setError(e.message || 'Could not load opportunities.'); });
    return () => { active = false; };
  }, []);
  const totals = rows?.reduce((sum, row) => ({ count: sum.count + row.count, value: sum.value + row.value, weighted: sum.weighted + row.weighted }), { count: 0, value: 0, weighted: 0 });
  return <section className="rounded-2xl border border-border bg-card p-5">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-heading text-base font-semibold">Opportunity pipeline</h2><p className="text-xs text-muted-foreground">Open opportunities you can access · excluding on hold</p></div><Link to="/crm/pipeline" className="text-sm font-medium text-primary hover:underline">View pipeline →</Link></div>
    {error ? <p role="alert" className="mt-4 text-sm text-destructive">{error}</p> : !rows ? <p className="mt-4 text-sm text-muted-foreground">Loading opportunities…</p> : <>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">{[['Open opportunities', totals.count], ['Pipeline value', formatCurrency(totals.value)], ['Weighted value', formatCurrency(totals.weighted)]].map(([label, value]) => <div key={label} className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>)}</div>
      {totals.count === 0 ? <p className="mt-5 text-sm text-muted-foreground">No open opportunities in the pipeline.</p> : detailed ? <div className="mt-5 h-72 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={rows} margin={{ left: 10, right: 15, bottom: 42 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey="stage" angle={-30} textAnchor="end" interval={0} tick={{ fontSize: 10 }} /><YAxis tickFormatter={v => `£${(v / 1000000).toFixed(1)}m`} tick={{ fontSize: 11 }} /><Tooltip formatter={(value, name) => [formatCurrency(value), name === 'value' ? 'Pipeline value' : 'Weighted value']} /><Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} /><Bar dataKey="weighted" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div> : null}
      <div className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2 xl:grid-cols-4">{rows.map(row => <div key={row.stage} className="flex justify-between gap-3 border-b border-border py-2 text-sm"><span className="min-w-0 text-muted-foreground">{row.stage} <span className="font-medium text-foreground">({row.count})</span></span><span className="shrink-0 font-medium">{formatCurrency(row.value)}</span></div>)}</div>
    </>}
  </section>;
}