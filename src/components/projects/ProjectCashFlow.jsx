import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { filterAll } from '@/components/data/loadAll';
import CashFlowChart from '@/components/projects/CashFlowChart';
import ProjectPOForecastSummary from '@/components/projects/finance/ProjectPOForecastSummary';

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

export default function ProjectCashFlow({ entries, commitments = [], loading, error, missingDates = 0, missingValues = 0, forecast, powerBI = false, dueDateFallback = 0 }) {
  return <section className="rounded-2xl border border-border bg-card p-5 space-y-5">
    <div><h3 className="font-heading text-base font-semibold text-card-foreground">Money in & out</h3>
      <p className="text-xs text-muted-foreground">{powerBI ? 'Power BI transaction values use the paid date first and the due date when no paid date is recorded. Dashed lines include expected payments, not confirmed cash receipts. PO totals remain commitments, not payments.' : 'Cumulative client payments, money out and net cash balance. Approved or issued POs are treated as paid outgoings at their net value because they are raised after payment approval, alongside recorded spending.'}</p></div>
    {!loading && !error && (missingDates > 0 || missingValues > 0) && <p className="text-xs text-muted-foreground">Excluded from the graph: {[missingDates > 0 && `${missingDates} transactions without a paid date or due date`, missingValues > 0 && `${missingValues} purchase orders without a complete net value`].filter(Boolean).join('; ')}.</p>}
    {!loading && !error && dueDateFallback > 0 && <p className="text-xs text-muted-foreground">{dueDateFallback} transaction lines use the due date because no paid date is recorded; these are shown as expected payments.</p>}
    {!loading && !error && <ProjectPOForecastSummary forecast={forecast} />}
    {loading ? <p className="py-12 text-center text-sm text-muted-foreground">Loading cash flow…</p> : error ? <p role="alert" className="text-sm text-destructive">{error}</p> : <CashFlowChart forecast={forecast} entries={[...entries, ...commitments.map(entry => ({ ...entry, type: 'spent' }))]} />}
  </section>;
}