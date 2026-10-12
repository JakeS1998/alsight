import React from 'react';
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';
import balanceTrendRows from '@/components/finance/balanceTrendRows';

export default function BalanceTrendIndicator({ rows }) {
  const points = balanceTrendRows(rows).filter(row => row.Balance != null && Number.isFinite(Number(row.Balance)) && Number.isFinite(row.Trend));
  if (points.length < 2) return null;
  const first = points[0].Trend;
  const change = points[points.length - 1].Trend - first;
  const steady = Math.abs(change) <= Math.abs(first) * 0.05;
  const Icon = steady ? ArrowRight : change > 0 ? ArrowUpRight : ArrowDownRight;
  const label = steady ? 'Holding steady' : change > 0 ? 'Trending up' : 'Trending down';
  const color = steady ? 'text-risk-elevated' : change > 0 ? 'text-destructive' : 'text-success';
  return <span className={`ml-2 inline-flex items-center gap-1 text-xs font-medium ${color}`} title="Overall three-month trend; changes of up to 5% are considered steady."><Icon className="h-3.5 w-3.5" aria-hidden="true" />{label}</span>;
}