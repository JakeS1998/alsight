import React from 'react';
import { FileText, ShoppingCart, Files, ChevronRight } from 'lucide-react';
import compactPipelineValue from '@/components/finance/compactPipelineValue';
const icons = [FileText, ShoppingCart, FileText, Files];
const captions = ['Total value of recorded POs', 'Total number of POs', 'Total value of client invoices', 'Total number of invoices'];
export default function PipelineMetricTile({ card, index }) {
  const [label, amount, detail] = card;
  const Icon = icons[index] || FileText;
  const display = typeof amount === 'number' ? amount.toLocaleString('en-GB') : compactPipelineValue(amount);
  return <div className="pipeline-metric" title={detail}>
    <span className={`pipeline-metric-icon ${index % 2 === 0 ? 'pipeline-metric-icon-accent' : ''}`} aria-hidden="true"><Icon size={23}/></span>
    <div className="pipeline-metric-body"><p className="pipeline-metric-label">{label}</p><p className="pipeline-metric-value" title={String(amount)}>{display}</p><p className="pipeline-metric-caption">{captions[index] || detail}</p><span className="sr-only">{detail}</span></div>
    <ChevronRight className="pipeline-metric-chevron" size={17} aria-hidden="true"/>
  </div>;
}