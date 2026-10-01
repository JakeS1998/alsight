import React from 'react';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
export default function JourneyStageButton({ stage, active, onSelect, compact = false }) {
  return <button type="button" onClick={() => onSelect(stage.id)} aria-current={active ? 'step' : undefined} title={`Pathway step ${stage.id} · ${stage.label}${stage.detail ? ` — ${stage.detail}` : ''}`} className={cn('rounded-lg border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', compact ? 'min-w-20 flex-1 p-2' : 'flex w-56 shrink-0 items-center gap-3 p-3 lg:w-full', active ? 'border-primary bg-primary/10 text-foreground' : 'border-transparent bg-card text-muted-foreground hover:bg-muted')}>
    <span className={cn('flex items-center gap-2', compact && 'justify-between')}>
      <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold', stage.showProgress !== false && stage.complete ? 'bg-success/10 text-success' : active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>{String(stage.id).padStart(2, '0')}</span>
      {compact && stage.showProgress !== false && <span className="flex items-center gap-1 text-[10px] tabular-nums">{stage.complete && <Check className="h-3 w-3 text-success" />}{stage.percent == null ? '—' : `${stage.percent}%`}</span>}
    </span>
    <span className={cn('block min-w-0 flex-1', compact && 'mt-1.5')}><span className={cn('block font-semibold', compact ? 'text-[10px]' : 'text-xs')}>{compact ? stage.short : stage.label}</span>{!compact && stage.showProgress !== false && <span className="mt-1 flex items-center gap-1.5 text-[10px] font-normal text-muted-foreground">{stage.complete ? <Check className="h-3 w-3 text-success" /> : <Circle className="h-2.5 w-2.5" />}{stage.percent == null ? stage.detail || 'Checking…' : `${stage.percent}% complete`}</span>}</span>
  </button>;
}