import React from 'react';
export default function ASEEligibilitySummary({report}) {
  if(!report) return null;
  return <details className="mt-3 rounded-md border border-border p-3 text-xs">
    <summary className="cursor-pointer font-semibold">{report.eligible_count} scoreable facts · {report.low_confidence_count} Low confidence · {report.excluded_count} context only</summary>
    <p className="mt-2 text-muted-foreground">Rule: {report.rule_version}. Eligibility is not the same as selection: the latest relevant component evidence determines the rating.</p>
    {report.compared_with_previous && <p className="mt-2">{report.newly_eligible_count} facts now qualify compared with the previous collection.</p>}
    {!!report.newly_eligible?.length && <ul className="mt-2 space-y-2">{report.newly_eligible.map((row,index)=><li key={index}><strong>{row.title} · {row.confidence}</strong><p className="text-muted-foreground">{row.reason}</p><a className="underline" href={row.source_reference} target="_blank" rel="noreferrer">View official source</a></li>)}</ul>}
    {!!report.exclusions?.length && <div className="mt-3"><h5 className="font-semibold">Why other facts remain unscored</h5><ul className="mt-1 space-y-2">{report.exclusions.map((item,index)=><li key={index}>{item.count} record{item.count===1 ? '' : 's'}: {item.reason}</li>)}</ul></div>}
  </details>;
}