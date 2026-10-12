import React from 'react';
import { formatCurrency } from '@/lib/portal';
import { Layers, Tag } from 'lucide-react';
import compactPipelineValue from '@/components/finance/compactPipelineValue';
import '@/components/finance/pipeline-summary.css';
export default function CommercialPipelineFigure({query}) {
 return <div className="pipeline-overview">
  <div className="pipeline-headline"><p className="pipeline-label">Live projects</p>
   {query.isPending ? <p className="pipeline-state" role="status">Calculating pipeline value…</p> : query.error ? <p className="pipeline-state" role="alert">Pipeline value unavailable: {query.error.message}</p> : <>
    <p className="pipeline-total" title={formatCurrency(query.data.value)}>{compactPipelineValue(query.data.value)}</p>
    <p className="pipeline-subtitle">Live project value</p>
     <p className="mt-2 text-xs text-sidebar-foreground/70">{compactPipelineValue(query.data.onHoldValue || 0)} · {(query.data.onHoldProjects || 0).toLocaleString('en-GB')} on-hold projects (not marked live)</p>
    <div className="pipeline-meta"><span title="Active records marked live, including completed projects still marked live"><Layers size={14} aria-hidden="true"/>{query.data.projects.toLocaleString('en-GB')} live projects</span><span><Tag size={14} aria-hidden="true"/>Excluding VAT</span></div>
   </>}
  </div>
  <p className="pipeline-explanation">Submitted client proposals take precedence over project estimates; values exclude VAT. Figures show data you can access based on your role and permissions.</p>
 </div>;
}