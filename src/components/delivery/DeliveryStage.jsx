import React, { useId } from 'react';
import useDeliveryStageState from '@/components/delivery/useDeliveryStageState';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import '@/components/delivery/DeliveryStage.css';
export default function DeliveryStage({ title, description, children, className, headerExtra, completed }) {
  const { expanded, toggle } = useDeliveryStageState(title, completed);
  const contentId = useId();
  return <section className={cn('delivery-stage', className)}>
    <header className="delivery-stage__header">
      <button type="button" aria-expanded={expanded} aria-controls={contentId} onClick={toggle} className="delivery-stage__toggle">
        <span className="delivery-stage__chevron" aria-hidden="true">{expanded ? <ChevronDown className="h-[15px] w-[15px]" strokeWidth={2} /> : <ChevronRight className="h-[15px] w-[15px]" strokeWidth={2} />}</span>
        <span className="min-w-0 flex-1"><span className="delivery-stage__title block">{title}</span>{description && <span className="delivery-stage__description mt-1 block font-body text-xs">{description}</span>}</span>
        <span className="delivery-stage__corner" aria-hidden="true" />
      </button>
    </header>
    <div id={contentId} hidden={!expanded} className="space-y-4 p-4">{headerExtra}{children}</div>
  </section>;
}