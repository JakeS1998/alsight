import React, { useContext } from "react";
import { cn } from "@/lib/utils";
import { DeliveryCollapseContext } from '@/components/delivery/DeliveryCollapseContext';
import DeliveryStage from '@/components/delivery/DeliveryStage';

/**
 * Power Apps-style form primitives: sectioned cards with labeled fields,
 * help text, required indicators and responsive two-column grids.
 */

export function FormSection({ title, description, children, className }) {
  const collapsible = useContext(DeliveryCollapseContext);
  if (collapsible) return <DeliveryStage title={title} description={description} className={className}>{children}</DeliveryStage>;
  return (
    <section className={cn("overflow-hidden rounded-xl border border-slate-200 bg-white", className)}>
      <header className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <span className="h-4 w-1 rounded-full bg-primary" />
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function FormGrid({ children, cols = 2 }) {
  return <div className={cn("grid gap-4", cols === 2 ? "sm:grid-cols-2" : "grid-cols-1")}>{children}</div>;
}

export function FormField({ label, required, help, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
        {label}
        {required && <span className="text-primary">*</span>}
      </label>
      {children}
      {help && !error && <p className="text-xs text-slate-400">{help}</p>}
      {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}

export const formInputClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";