import React from 'react';
import CompassTrendChart from '@/components/ase/v2/CompassTrendChart';
import {compassNumber,compassDate} from '@/components/ase/v2/compassDetailFormat';
export default function CompassEvidenceExplanation({check}) {
  const detail=check.presentation;
  return <div className="mt-3 space-y-3">
    {detail?.meaning && <div><h4 className="font-semibold">What this checks</h4><p className="mt-1 leading-relaxed text-muted-foreground">{detail.meaning}</p></div>}
    <div><h4 className="font-semibold">{check.score==null?'Why this is unscored':'Why this score?'}</h4><p className="mt-1 leading-relaxed">{detail?.why || check.reason}</p></div>
    {detail?.figures?.length>0 && <div className="overflow-x-auto"><table className="w-full text-left"><caption className="mb-2 text-left font-semibold">Figures behind the result</caption><thead className="bg-muted"><tr><th className="p-2">Measure</th><th className="p-2">Period ending</th><th className="p-2 text-right">Value</th></tr></thead><tbody>{detail.figures.map((figure,index)=><tr key={index} className="border-b border-border"><td className="p-2 capitalize">{figure.label}</td><td className="p-2">{figure.period?compassDate(figure.period):'—'}</td><td className="p-2 text-right font-semibold tabular-nums">{compassNumber(figure.value,figure.unit)}</td></tr>)}</tbody></table></div>}
    {detail?.chart && <CompassTrendChart chart={detail.chart}/>}
    {!detail?.chart && <CompassTrendChart chart={detail?.score_history}/>}
    {detail?.limitation && <p className="rounded-md bg-muted p-3 text-muted-foreground">{detail.limitation}</p>}
    {detail?.bands?.length>0 && <details><summary className="cursor-pointer font-semibold">How the recorded figure maps to a score</summary><table className="mt-2 w-full text-left"><thead><tr><th className="py-1">Recorded measure</th><th className="py-1 text-right">Score</th></tr></thead><tbody>{detail.bands.map((band,index)=><tr key={index} className={band.score===check.score?'bg-primary/10 font-semibold':''}><td className="p-2">{band.label}</td><td className="p-2 text-right">{band.score}/5</td></tr>)}</tbody></table><p className="mt-2 text-muted-foreground">Saved rules at this assessment’s publication, shown for explanation only.</p></details>}
  </div>;
}