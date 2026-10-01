import React, { useId, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
export default function DeliveryStage({ title, description, children, className, headerExtra }) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  return <section className={cn('overflow-hidden rounded-xl border border-border bg-card', className)}>
    <header className="border-b border-border bg-muted/50">
      <button type="button" aria-expanded={expanded} aria-controls={contentId} onClick={() => setExpanded(value => !value)} className="flex w-full items-center gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
        <span className="h-4 w-1 shrink-0 rounded-full bg-primary" />
        <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-foreground">{title}</span>{description && <span className="block text-xs text-muted-foreground">{description}</span>}</span>
        {expanded ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>
    </header>
    <div id={contentId} hidden={!expanded} className="space-y-4 p-4">{headerExtra}{children}</div>
  </section>;
}