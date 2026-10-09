import React from 'react';
import { formatCurrency } from '@/lib/portal';
import { getLADStages, LAD_PERIODS } from '@/components/delivery/ladSchedule';
export default function LADScheduleSummary({ delivery }) {
  const stages = getLADStages(delivery);
  if (!stages.length) return <p className="text-sm text-muted-foreground">No LAD stages recorded.</p>;
  return <div className="space-y-2"><h4 className="text-sm font-semibold">LAD charging schedule · each started period</h4>{stages.map((stage, index) => <p key={index} className="text-sm">Stage {index + 1}: {stage.basis === 'percentage' ? `${stage.value}% of contractor contract sum` : formatCurrency(stage.value)} per {LAD_PERIODS[stage.period]} · {stage.periods == null || stage.periods === '' ? 'thereafter until completion' : `${stage.periods} period${Number(stage.periods) === 1 ? '' : 's'}`}</p>)}</div>;
}