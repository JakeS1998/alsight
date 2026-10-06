import React from 'react';
import ASEGauge from '@/components/ase/ASEGauge';
import {formatDateTime} from '@/lib/portal';
import allSeeingEyeText from '@/components/ase/allSeeingEyeText';
export default function ASEV2Header({assessment}) {
  const a=assessment;
  return <section className="rounded-xl border border-border bg-muted p-5">
    <div className="flex flex-wrap items-center gap-6"><div className="w-44"><ASEGauge rating={a.final_score} precise={a.final_score} label={a.classification} decimal/></div><div className="min-w-0 flex-1"><p className="text-xs uppercase tracking-widest text-muted-foreground">All Seeing Eye</p><h2 className="mt-1 text-3xl font-bold">{a.final_score===null ? 'Not assessed' : `All Seeing Eye ${a.final_score.toFixed(1)}`} <span className="text-lg">{a.final_score!==null && a.classification}</span></h2><p className="mt-2 font-semibold">{a.confidence} confidence · {a.coverage.toFixed(1)}% evidence coverage</p><p className="mt-1 text-xs text-muted-foreground">Last assessed: {formatDateTime(a.assessment_date)}</p><p className="mt-3 text-xs text-muted-foreground">Organisational stability, Alliance exposure, performance and regulatory evidence. Not an external credit rating.</p></div></div>
    {a.caps.map((cap,index)=><p key={index} className="mt-3 rounded-md border border-destructive p-3 text-sm"><strong>Verified severe-event cap: {cap.cap}/5.</strong> {cap.reason}</p>)}
    <details className="mt-3 text-sm"><summary className="cursor-pointer font-semibold">How this score was calculated</summary><p className="mt-2 leading-relaxed">{a.explanation}</p><p className="mt-2 text-xs text-muted-foreground">Methodology: {allSeeingEyeText(a.policy_version)}. Raw score: {a.raw_score?.toFixed(6) ?? 'Unavailable'}. Final score before display rounding: {a.final_score?.toFixed(6) ?? 'Unavailable'}.</p></details>
  </section>;
}