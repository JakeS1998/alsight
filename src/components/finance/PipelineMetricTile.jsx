import React from 'react';
import KpiIllustration from '@/components/metrics/KpiIllustration';
import { FileText, ShoppingCart, Files } from 'lucide-react';
import compactPipelineValue from '@/components/finance/compactPipelineValue';
const icons = [FileText, ShoppingCart, FileText, Files];
const captions = ['Total value of recorded POs', 'Total number of POs', 'Total value of client invoices', 'Total number of invoices'];
export default function PipelineMetricTile({ card, index }) {
  const [label, amount, detail] = card;
  const Icon = icons[index] || FileText;
  const display = typeof amount === 'number' ? amount.toLocaleString('en-GB') : compactPipelineValue(amount);
  return <div className="pipeline-metric alsight-illustrated-kpi" title={detail}>
    <KpiIllustration label={label} variant={['finance','contracts','calculations','reports'][index]}/>
    <div className="pipeline-metric-body"><p className="pipeline-metric-label">{label}</p><p className="pipeline-metric-value" title={String(amount)}>{display}</p><p className="pipeline-metric-caption">{captions[index] || detail}</p><span className="sr-only">{detail}</span></div>
  </div>;
}