import React from 'react';
import { CheckCircle2, Circle, ChevronDown } from 'lucide-react';
export default function JourneyProgressBreakdown({ stage }) {
  return <details key={stage.id} className="mb-4 rounded-xl border border-border bg-card p-4">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-foreground">
      <span>Why this percentage? <span className="font-normal text-muted-foreground">{stage.percent == null ? 'Checking…' : `${stage.percent}%`}</span></span><ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
    </summary>
    <div className="mt-3 space-y-3">
      <p className="text-xs text-muted-foreground">{stage.explanation || stage.detail || 'Checking completion information…'}</p>
      {stage.checks?.map((check, index) => <div key={index} className="flex items-start gap-2 text-xs">
        {check.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
        <div className="min-w-0"><p className="text-foreground">{check.label}<span className={check.done ? 'ml-2 text-success' : 'ml-2 text-muted-foreground'}>{check.done ? 'Complete' : 'Outstanding'}</span></p>{check.detail && <p className="mt-1 text-muted-foreground">{check.detail}</p>}</div>
      </div>)}
    </div>
  </details>;
}