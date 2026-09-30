import React, { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function DashboardInfoTooltip({ label, children, side = 'top' }) {
  const [open, setOpen] = useState(false);
  return <TooltipProvider delayDuration={0} skipDelayDuration={0}>
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button type="button" aria-label={`About ${label}`} aria-expanded={open} onClick={event => { event.preventDefault(); event.stopPropagation(); setOpen(value => !value); }} className="relative z-10 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-card text-xs font-semibold leading-none text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">?</button>
      </TooltipTrigger>
      <TooltipContent side={side} sideOffset={6} className="z-[100] max-w-xs bg-als-navy p-3 text-left text-xs font-normal leading-relaxed text-sidebar-foreground shadow-lg">{children}</TooltipContent>
    </Tooltip>
  </TooltipProvider>;
}