import React from 'react';
import { formatCurrency } from '@/lib/portal';

export default function ValuationMetric({ label, value, explanation }) {
  return <div className="rounded-xl bg-secondary p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="mt-1 text-base font-semibold text-als-navy">{value == null ? 'Not recorded' : formatCurrency(value)}</p>
    <p className="mt-2 text-xs text-muted-foreground">{explanation}</p>
  </div>;
}