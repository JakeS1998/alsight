import React from 'react';

export default function DataQualityCards({ checks, selected, onSelect }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
    {checks.map(check => <button key={check.key} type="button" onClick={() => onSelect(check.key)} aria-pressed={selected === check.key} className={`rounded-xl border p-4 text-left ${selected === check.key ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-muted'}`}>
      <p className="text-sm font-medium">{check.label}</p>
      <p className={`mt-2 text-3xl font-semibold ${check.count ? 'text-destructive' : 'text-foreground'}`}>{check.count.toLocaleString('en-GB')}</p>
      <p className="mt-2 text-xs text-muted-foreground">{check.key === 'duplicates' ? 'groups to review' : 'records to review'}</p>
    </button>)}
  </div>;
}