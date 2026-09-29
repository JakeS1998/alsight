import React from 'react';
import { formatCurrency } from '@/lib/portal';

export default function IncomeProjectionKey() {
  return <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
    <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-chart-1" />Paid invoices</span>
    <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-chart-2" />Projected balance</span>
  </div>;
}

export function IncomeProjectionTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return <div className="rounded-xl border border-border bg-card p-3 text-xs shadow-sm">
    <p className="mb-2 font-semibold text-card-foreground">{label}</p>
    <p>Paid invoices: {formatCurrency(row.confirmed)}</p>
    <p>Projected balance: {formatCurrency(row.remaining)}</p>
    <p className="mt-1 border-t border-border pt-1 font-medium">Total project value: {formatCurrency(row.value)}</p>
  </div>;
}