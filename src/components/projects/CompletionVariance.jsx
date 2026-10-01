import React from 'react';
export default function CompletionVariance({ expected, actual }) {
  const planned = expected ? Date.parse(`${String(expected).slice(0, 10)}T00:00:00Z`) : NaN;
  const recorded = actual ? Date.parse(`${String(actual).slice(0, 10)}T00:00:00Z`) : NaN;
  if (!Number.isFinite(planned) || !Number.isFinite(recorded)) return <span className="text-muted-foreground" title="Variance requires both expected and actual completion dates">—</span>;
  const days = Math.round((recorded - planned) / 86400000);
  const tone = days > 0 ? 'bg-destructive/10 text-destructive' : days < 0 ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground';
  return <span title={days > 0 ? `${days} days later than expected` : days < 0 ? `${Math.abs(days)} days earlier than expected` : 'Completed on the expected date'} className={`inline-flex whitespace-nowrap rounded-md px-2 py-1 text-xs font-semibold tabular-nums ${tone}`}>{days === 0 ? 'On time' : `${days > 0 ? '+' : '−'}${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'}`}</span>;
}