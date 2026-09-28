import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function DashboardInfoTooltip({ label, children, side = 'top' }) {
  return <TooltipProvider delayDuration={0} skipDelayDuration={0}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label={`About ${label}`} className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-400 text-xs font-semibold leading-none text-slate-600 hover:border-als-navy hover:text-als-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">?</button>
      </TooltipTrigger>
      <TooltipContent side={side} sideOffset={6} className="max-w-xs bg-als-navy p-3 text-left text-xs font-normal leading-relaxed text-sidebar-foreground shadow-lg">{children}</TooltipContent>
    </Tooltip>
  </TooltipProvider>;
}