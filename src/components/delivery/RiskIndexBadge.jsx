import React from 'react';
import { riskHeat } from '@/components/delivery/riskHeat';
export default function RiskIndexBadge({ index }) {
  const band = riskHeat(index);
  return <span title={`${band.label}${band.range ? ` · ${band.range}` : ''}`} className={`inline-flex min-w-10 items-center justify-center rounded-md px-2 py-1 font-semibold tabular-nums text-foreground ${band.badgeClass}`}>
    {index ?? '—'}<span className="sr-only"> · {band.label}</span>
  </span>;
}