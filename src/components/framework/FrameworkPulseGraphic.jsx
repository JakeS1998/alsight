import React from 'react';

export default function FrameworkPulseGraphic({ total, linked }) {
  const ready = Number.isFinite(total) && Number.isFinite(linked);
  const percentage = ready && total > 0 ? Math.min(100, linked / total * 100) : 0;
  return <div className="flex shrink-0 items-center gap-3">
    <svg viewBox="0 0 100 100" className="h-20 w-20" role="img" aria-label={ready ? `${linked} of ${total} Framework projects linked to ALSight` : 'Loading Framework links'}>
      <circle cx="50" cy="50" r="39" fill="none" className="stroke-secondary" strokeWidth="8" />
      <circle cx="50" cy="50" r="39" fill="none" className="stroke-primary" strokeWidth="8" pathLength="100" strokeDasharray={`${percentage} ${100 - percentage}`} transform="rotate(-90 50 50)" />
      <text x="50" y="55" textAnchor="middle" className="fill-foreground text-lg font-bold">{ready ? `${Math.round(percentage)}%` : '—'}</text>
    </svg>
    <p className="max-w-20 text-xs leading-relaxed text-muted-foreground">Linked to ALSight</p>
  </div>;
}