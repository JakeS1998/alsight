import React from 'react';
import { Link } from 'react-router-dom';
import { regionName } from '@/lib/portal';
export default function CapacityManagementInsight({insight}) {
  return <details className="rounded-md border border-border bg-card p-3">
    <summary className="cursor-pointer text-xs font-semibold">
      {insight.title}{insight.regionId && `: ${regionName(insight.regionId) || 'Region not recorded'}`}
      {insight.summary && <span className="mt-1 block font-normal text-muted-foreground">{insight.summary}</span>}
    </summary>
    {insight.findings ? <dl className="mt-3 space-y-2 text-xs">{insight.findings.map(finding=><div key={finding.label}>
      <dt className="font-semibold">{finding.label}</dt><dd className="mt-0.5 text-muted-foreground">{finding.text}</dd>
    </div>)}</dl> : <p className="mt-2 text-xs">{insight.identified}</p>}
    <p className="mt-2 text-xs"><span className="font-semibold">Suggested action: </span>{insight.review}</p>
    <p className="mt-2 text-xs text-muted-foreground">{insight.why}</p>
    {!!insight.records.length && <div className="mt-2 flex flex-wrap gap-2">{insight.records.map(record=><Link key={record.href} to={record.href} className="text-xs text-chart-2 underline">{record.label}</Link>)}</div>}
  </details>;
}