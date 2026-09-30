import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function ChecklistHover({ title, details = [], children }) {
  return <TooltipProvider delayDuration={150}><Tooltip>
    <TooltipTrigger asChild>{React.cloneElement(children, { tabIndex: children.props.tabIndex ?? 0 })}</TooltipTrigger>
    <TooltipContent side="top" className="max-w-sm border border-border bg-popover p-3 text-popover-foreground shadow-lg">
      <p className="mb-2 text-sm font-semibold">{title}</p>
      <ul className="space-y-1 text-xs leading-relaxed">{details.map((detail, index) => <li key={index}>{detail}</li>)}</ul>
    </TooltipContent>
  </Tooltip></TooltipProvider>;
}