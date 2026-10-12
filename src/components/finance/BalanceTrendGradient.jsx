import React from 'react';
const neutral = 'hsl(var(--muted-foreground))';
export default function BalanceTrendGradient({ id, rows }) {
  const segments = rows.slice(1).map((row, index) => {
    const previous = rows[index].Balance;
    const current = row.Balance;
    const valid = previous != null && current != null && Number.isFinite(Number(previous)) && Number.isFinite(Number(current));
    const color = !valid || Number(current) === Number(previous) ? neutral : Number(current) < Number(previous) ? 'hsl(var(--success))' : 'hsl(var(--destructive))';
    return { start: index / (rows.length - 1), end: (index + 1) / (rows.length - 1), color };
  });
  return <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
    {segments.length ? segments.map((segment, index) => <React.Fragment key={index}>
      <stop offset={`${segment.start * 100}%`} stopColor={segment.color} />
      <stop offset={`${segment.end * 100}%`} stopColor={segment.color} />
    </React.Fragment>) : <stop offset="0%" stopColor={neutral} />}
  </linearGradient>;
}