import React from 'react';

import CommercialPipelineFigure from '@/components/finance/CommercialPipelineFigure';
export default function FinanceExecutiveBriefing({pipeline,cards}) {
  return <div>
    <section className="finance-hero" aria-label="Commercial pipeline and commitments">
      <CommercialPipelineFigure query={pipeline}/>
      <div className="finance-kpis">{cards.map(([label,amount,note])=><div key={label} className="finance-kpi"><p>{label}</p><p>{typeof amount==='number'?amount.toLocaleString('en-GB'):amount}</p><p>{note}</p></div>)}</div>
    </section>

  </div>;
}