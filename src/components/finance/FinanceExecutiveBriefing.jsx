import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
export default function FinanceExecutiveBriefing({data,cards,missing}) {
  const {user}=useAuth(), cost=cards[1], kpis=cards.filter((_,i)=>i!==1);
  const priorities=[cards[0],cards[2],cards[5]];
  return <div className="finance-executive-row">
    <section className="finance-hero" aria-label="Recorded finance snapshot">
      <div className="finance-hero-inner"><p className="finance-hero-label">{cost[0]}</p><p className="finance-big">{cost[1]}</p><p className="finance-hero-note">{data.source}</p></div>
      <div className="finance-kpis">{kpis.map(([label,amount])=><div key={label} className="finance-kpi"><p>{label}</p><p>{typeof amount==='number'?amount.toLocaleString('en-GB'):amount}</p></div>)}</div>
    </section>
    <aside className="finance-briefing-side">
      <section className="finance-card finance-accent finance-delay-2"><h2>What’s missing from the finance data?</h2><p className="finance-muted mt-2">Coverage is measured from the completed snapshot, not assumed from saved mappings.</p>
        <div className="mt-4">{priorities.map(([label,amount])=><div key={label} className="finance-priority"><span className={label===cards[5][0]&&amount>0?'finance-priority-value text-destructive':'finance-priority-value'}>{amount}</span><p className="finance-muted">{label}</p></div>)}</div>
        {missing>0&&<p className="finance-small text-destructive mt-2">{missing} POs have no net value; commitment totals are incomplete.</p>}
        {!data.invoices_have_values&&<p className="finance-small mt-2">Sales-invoice net value is unavailable, not zero.</p>}
        {data.coverage_pending&&<p className="finance-small mt-2">A new sync is in progress; table-level mapping coverage will update when that snapshot completes.</p>}
        {user?.role==='admin'&&<Link to="/admin/finance" className="finance-button finance-button-soft mt-4">Review mappings &amp; project links</Link>}
      </section>
      <section className="finance-card finance-delay-3"><h3>Completed Dataverse snapshot</h3><p className="finance-muted mt-2">Last completed sync: {new Date(data.read_at).toLocaleString('en-GB')}.</p><p className="finance-small mt-2">Finance data and mappings are restricted to administrators, finance staff and directors.</p></section>
    </aside>
  </div>;
}