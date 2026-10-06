import React from 'react';
import ASEV2Evidence from '@/components/ase/v2/ASEV2Evidence';
export default function ASEV2Components({assessment}) {
  return <section><h3 className="mb-3 font-semibold">Seven scored components</h3><div className="grid items-start gap-3 md:grid-cols-2">{assessment.components.map(c=><details className="min-w-0 rounded-lg border border-border bg-card p-4" key={c.key}>
    <summary className="cursor-pointer"><div className="flex items-start justify-between gap-3"><strong className="text-sm">{c.label}</strong><span className="shrink-0 font-bold">{c.score===null ? 'Limited evidence' : c.score.toFixed(2)}</span></div><p className="mt-2 text-xs text-muted-foreground">{c.weight}% configured weight · {c.coverage.toFixed(1)}% component evidence coverage</p></summary>
    <p className="my-3 text-xs">{c.score===null ? 'No score invented. Missing evidence reduces overall confidence and coverage.' : `${c.score.toFixed(4)} × ${c.effective_weight.toFixed(2)}% effective weight = ${c.weighted_contribution.toFixed(6)} overall points.`}</p><div className="space-y-2">{assessment.checks.filter(check=>check.component===c.key).map(check=><ASEV2Evidence key={check.key} check={check}/>)}</div>
  </details>)}</div></section>;
}