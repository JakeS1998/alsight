import React from 'react';
import { RISK_HEAT_BANDS } from '@/components/delivery/riskHeat';
export default function RiskHeatLegend() {
  return <div aria-label="Risk index heat scale" className="flex flex-wrap items-center gap-2 text-xs text-foreground">
    <span className="font-medium">Risk index:</span>
    {RISK_HEAT_BANDS.map(band => <span key={band.label} className={`rounded-md px-2 py-1 ${band.badgeClass}`}>{band.label} {band.range}</span>)}
    <span className="rounded-md bg-muted px-2 py-1">Unscored —</span>
  </div>;
}