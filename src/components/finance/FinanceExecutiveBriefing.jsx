import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import CommercialPipelineFigure from '@/components/finance/CommercialPipelineFigure';
export default function FinanceExecutiveBriefing({data,pipeline,cards,missing,review}) {
   const {user}=useAuth();
   const priorities=[['POs missing net values',missing],['Invoices missing net values',data.amounts.find(r=>r.kind==='invoices'&&!r.has_amount)?.count||0],['Projects needing a link',review]];
  return <div className="finance-executive-row">
    <section className="finance-hero" aria-label="Commercial pipeline and commitments">
      <CommercialPipelineFigure query={pipeline}/>
      <div className="finance-kpis">{cards.map(([label,amount,note])=><div key={label} className="finance-kpi"><p>{label}</p><p>{typeof amount==='number'?amount.toLocaleString('en-GB'):amount}</p><p>{note}</p></div>)}</div>
    </section>
    <aside className="finance-briefing-side">
      <section className="finance-card finance-accent finance-delay-2"><h2>Commercial data checks</h2><p className="finance-muted mt-2">Coverage is measured from the completed snapshot, not assumed from saved mappings.</p>
        <div className="mt-4">{priorities.map(([label,amount])=><div key={label} className="finance-priority"><span className={amount>0?'finance-priority-value text-destructive':'finance-priority-value'}>{amount}</span><p className="finance-muted">{label}</p></div>)}</div>
        {missing>0&&<p className="finance-small text-destructive mt-2">{missing} POs have no net value; commitment totals are incomplete.</p>}
        {!data.invoices_have_values&&<p className="finance-small mt-2">Sales-invoice net value is unavailable, not zero.</p>}
        {data.coverage_pending&&<p className="finance-small mt-2">A new sync is in progress; table-level mapping coverage will update when that snapshot completes.</p>}
        {user?.role==='admin'&&<Link to="/admin/finance" className="finance-button finance-button-soft mt-4">Review mappings &amp; project links</Link>}
      </section>
      <section className="finance-card finance-delay-3"><h3>Completed Dataverse snapshot</h3><p className="finance-muted mt-2">Last completed sync: {new Date(data.read_at).toLocaleString('en-GB')}.</p><p className="finance-small mt-2">All figures and records follow your existing data access rules. Sales invoices are not supplier invoices or evidence of payment.</p></section>
    </aside>
  </div>;
}