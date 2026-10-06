import React from 'react';
import {formatCurrency,formatDate} from '@/lib/portal';
export default function ASECommercialRevenue({turnover,historical=false}) {
  const available=turnover?.status==='available' && Number.isFinite(turnover.value) && turnover.value>0;
  return <section className="rounded-lg border border-border bg-card p-4" aria-label="Reported annual company revenue">
    <p className="text-xs font-semibold text-muted-foreground">{historical ? 'Reported annual revenue at assessment' : 'Latest reported annual revenue'} · Company turnover</p>
    <p className="mt-2 text-2xl font-semibold tabular-nums">{available ? formatCurrency(turnover.value) : 'Unavailable'}</p>
    {available ? <>
      <p className="mt-2 text-xs">{turnover.period_start ? `${formatDate(turnover.period_start)} to ${formatDate(turnover.period_end)}` : `Year ended ${formatDate(turnover.period_end)}`}</p>
      <p className="mt-1 text-xs text-muted-foreground">Companies House filed accounts · Company-only annual revenue, independent of Alliance contracts.</p>
      {turnover.source_reference && <a href={turnover.source_reference} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs underline">View filed accounts{turnover.page ? ` · page ${turnover.page}` : ''}</a>}
      {(turnover.extraction==='pdf' || turnover.confidence==='Low') && <p className="mt-2 text-xs text-muted-foreground">Low confidence{turnover.extraction==='pdf' ? ' · PDF extraction, not independently verified.' : '.'}</p>}
    </> : <p className="mt-2 text-xs text-muted-foreground">{turnover?.reason || (historical ? 'Annual turnover was not retained in this historical comparison.' : 'No usable annual company turnover evidence is available.')} Missing contract records do not prevent revenue from being shown when it is disclosed.</p>}
  </section>;
}