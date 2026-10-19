import React from 'react';
import { AlertTriangle } from 'lucide-react';
import formatOverviewNumber from '@/components/dashboard/formatOverviewNumber';
import OverviewAttentionProjects from '@/components/dashboard/OverviewAttentionProjects';

export default function OverviewAttentionKpi({ metrics, businessContext, projects, onRisk }) {
  const explanation = 'Pipeline projects with overdue unfinished actions, an overdue forecast completion, or a forecast later than the original completion date. Each project counts once, even if it has several flags.';
  return <section className="dashboard-panel overview-kpi-attention flex flex-col border-primary/40" aria-label="Pipeline projects needing attention">
    <button type="button" onClick={onRisk} className="w-full rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" title={explanation}>
      <span className="flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">Your selected view</span><span className="alsight-summary-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"><AlertTriangle aria-hidden="true" className="h-6 w-6"/></span></span>
      <strong className="block text-5xl font-extrabold leading-none tracking-tight sm:text-6xl">{formatOverviewNumber(metrics.atRisk, false)}</strong>
      <h2 className="mt-3 text-xl font-bold leading-snug">Pipeline projects needing attention</h2>
      <span className="mt-2 block text-sm text-muted-foreground">{formatOverviewNumber(metrics.highRisk, false)} high priority · overdue actions or delays</span>
    </button>
    <div className="my-4 border-t border-border pt-4"><OverviewAttentionProjects projects={projects}/></div>
    {businessContext && <p className="mt-auto border-t border-border pt-3 text-xs text-muted-foreground" title={`The same measure across Alliance, independent of your access permissions and selected filters. ${explanation}`}><strong className="font-semibold">{formatOverviewNumber(businessContext.atRisk, false)}</strong> across Alliance</p>}
  </section>;
}