import React from 'react';

import CommercialPipelineFigure from '@/components/finance/CommercialPipelineFigure';
import PipelineMetricTile from '@/components/finance/PipelineMetricTile';
export default function FinanceExecutiveBriefing({pipeline,cards}) {
  return <div>
    <section className="finance-hero finance-pipeline-summary" aria-label="Commercial pipeline and commitments">
      <CommercialPipelineFigure query={pipeline}/>
      <div className="pipeline-metrics">{cards.map((card,index)=><PipelineMetricTile key={card[0]} card={card} index={index}/>)}</div>
    </section>

  </div>;
}