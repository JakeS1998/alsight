import React from 'react';
import { formatCurrency } from '@/lib/portal';
export default function FinanceCostRanking({data}) {
  const max=Math.max(...data.top.map(r=>r.sum_amount),1);
  return <section className="finance-card finance-delay-4">
    <h2>{data.top_kind==='line_items'?'Largest PO line-item costs':'Largest project PO commitments'}</h2><p className="finance-muted mt-2 mb-4">Project cost ranking</p>
    {data.top.length?data.top.map((row,i)=><div key={row.parent_id||row.project_key||i} className="finance-ranking-row"><span className="finance-ranking-name">{row.project_name||'Project lookup missing'}</span><div className="finance-ranking-track"><div className="finance-ranking-fill" style={{width:`${row.sum_amount/max*100}%`}}/></div><span className="finance-ranking-amount">{formatCurrency(row.sum_amount)}</span></div>):<p className="finance-muted">No valued project costs available in this snapshot.</p>}
  </section>;
}