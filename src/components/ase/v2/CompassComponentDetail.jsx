import React from 'react';
import ASEV2Evidence from '@/components/ase/v2/ASEV2Evidence';
import CompassTrendChart from '@/components/ase/v2/CompassTrendChart';
export default function CompassComponentDetail({component,checks}) {
  const detail=component.presentation;
  return <div className="mt-3 space-y-4 text-xs">
    <section><h4 className="font-semibold">What this component measures</h4><p className="mt-1 leading-relaxed text-muted-foreground">{detail?.meaning || component.label}</p></section>
    <section className="rounded-md bg-muted p-3"><h4 className="font-semibold">Why this component scored {component.score==null?'no result':`${component.score.toFixed(2)}/5`}</h4><p className="mt-1 leading-relaxed">{detail?.why || 'Only usable scored evidence contributes; missing evidence reduces coverage, not the numeric score.'}</p></section>
    <CompassTrendChart chart={detail?.chart}/>
    <section className="space-y-2"><h4 className="font-semibold">Checks behind this result</h4>{checks.map(check=><ASEV2Evidence key={check.key} check={check}/>)}</section>
    <details className="text-muted-foreground"><summary className="cursor-pointer font-semibold">Contribution to the overall Compass score</summary><p className="mt-2">{component.score==null?'This component has no usable numeric score and is excluded, not assigned zero.':`${component.score.toFixed(2)}/5 × ${component.effective_weight.toFixed(2)}% effective weight contributes ${component.weighted_contribution.toFixed(3)} overall points.`}</p></details>
  </div>;
}