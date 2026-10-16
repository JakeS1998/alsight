import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';
export default function SupplierCapacityPanel({ title, open = true, onOpenChange, children, label }) {
 const contentId = useId();
 return <section className="ws-card ws-panel min-w-0" aria-label={label}>
  <h3 className="ws-sectiontitle">{onOpenChange ? <button type="button" className="flex w-full items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-expanded={open} aria-controls={contentId} onClick={() => onOpenChange(!open)}>
   {title}<ChevronDown className={`h-4 w-4 shrink-0 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
  </button> : title}</h3>
  <div id={contentId} hidden={!open}>{children}</div>
 </section>;
}