import React from 'react';
import CompassComponentDetail from '@/components/ase/v2/CompassComponentDetail';
export default function ASEV2Components({assessment}) {
  return <section><h3 className="mb-3 font-semibold">Seven scored components</h3><div className="grid items-start gap-3 md:grid-cols-2">{assessment.components.map(c=><details className="min-w-0 rounded-lg border border-border bg-card p-4" key={c.key}>
    <summary className="cursor-pointer"><div className="flex items-start justify-between gap-3"><strong className="text-sm">{c.label}</strong><span className="shrink-0 font-bold">{c.score===null ? 'Limited evidence' : c.score.toFixed(2)}</span></div><p className="mt-2 text-xs text-muted-foreground">{c.weight}% configured weight · {c.coverage.toFixed(1)}% component evidence coverage</p></summary>
    <CompassComponentDetail component={c} checks={assessment.checks.filter(check=>check.component===c.key)}/>
  </details>)}</div></section>;
}