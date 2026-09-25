import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { filterAll } from '@/components/data/loadAll';
import CashFlowChart from '@/components/projects/CashFlowChart';
import CashFlowEntries from '@/components/projects/CashFlowEntries';

export default function ProjectCashFlow({ projectId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true);
    filterAll(base44.entities.ProjectCashFlow, { project_id: projectId }, '-date')
      .then(data => { if (active) setEntries(data); })
      .catch(() => { if (active) setError('Could not load transactions.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [projectId]);
  const add = async data => {
    const item = await base44.entities.ProjectCashFlow.create({ ...data, project_id: projectId });
    setEntries(previous => [item, ...previous]);
  };
  const remove = async id => {
    await base44.entities.ProjectCashFlow.delete(id);
    setEntries(previous => previous.filter(item => item.id !== id));
  };
  return <section className="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div><h3 className="font-heading text-base font-semibold text-card-foreground">Project cash flow</h3><p className="text-xs text-muted-foreground">Cumulative actual receipts from the council and spending, based on the transactions recorded below. Purchase orders are not counted as payments.</p></div>
    {loading ? <p className="py-12 text-center text-sm text-muted-foreground">Loading transactions…</p> : error ? <p role="alert" className="text-sm text-destructive">{error}</p> : <><CashFlowChart entries={entries} /><CashFlowEntries entries={entries} onAdd={add} onDelete={remove} /></>}
  </section>;
}