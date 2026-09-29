import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { filterAll } from '@/components/data/loadAll';
import CashFlowChart from '@/components/projects/CashFlowChart';

export function useProjectCashFlow(projectId) {
  const [invoices, setInvoices] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([
      filterAll(base44.entities.Invoice, { project_id: projectId }),
      filterAll(base44.entities.ProjectCashFlow, { project_id: projectId }),
    ]).then(([paidInvoices, entries]) => {
      if (active) { setInvoices(paidInvoices.filter(i => i.status === 'paid' && i.paid_date)); setTransactions(entries); }
    }).catch(() => { if (active) setError('Could not load cash flow.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [projectId]);
  const entries = [
    ...invoices.map(i => ({ date: i.paid_date, amount: i.amount, type: 'received' })),
    ...transactions,
  ];
  return { invoices, entries, loading, error };
}

export default function ProjectCashFlow({ entries, commitments = [], loading, error }) {
  return <section className="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div><h3 className="font-heading text-base font-semibold text-card-foreground">Money in & out</h3>
      <p className="text-xs text-muted-foreground">Cumulative client payments, recorded spending and approved PO commitments (net, using line items where the PO total is missing). Commitments are not payments; sample figures are illustrative.</p></div>
    {loading ? <p className="py-12 text-center text-sm text-muted-foreground">Loading cash flow…</p> : error ? <p role="alert" className="text-sm text-destructive">{error}</p> : <CashFlowChart entries={entries} commitments={commitments} />}
  </section>;
}