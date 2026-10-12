import React from 'react';
const neutral = 'hsl(var(--muted-foreground))';
export default function BalanceTrendGradient({ id, rows }) {
  const segments = rows.slice(1).map((row, index) => {
    const previous = rows[index].Balance;
    const current = row.Balance;
    const valid = previous != null && current != null && Number.isFinite(Number(previous)) && Number.isFinite(Number(current));
    const change = Number(current) - Number(previous);
    const smallChange = Math.abs(change) <= Math.abs(Number(previous)) * 0.05;
    const color = !valid || change === 0 ? neutral : smallChange ? 'hsl(var(--risk-elevated))' : change < 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))';
    return { start: index / (rows.length - 1), end: (index + 1) / (rows.length - 1), color };
  });
  return <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
    {segments.length ? <>
      <stop offset="0%" stopColor={segments[0].color} />
      {segments.map((segment, index) => <stop key={index} offset={`${(segment.start + segment.end) * 50}%`} stopColor={segment.color} />)}
      <stop offset="100%" stopColor={segments[segments.length - 1].color} />
    </> : <stop offset="0%" stopColor={neutral} />}
  </linearGradient>;
}