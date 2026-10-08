import React from 'react';

export default function FinanceComingSoon({ children }) {
  return <div className="relative isolate min-h-[24rem]">
    <div inert="" aria-hidden="true" className="pointer-events-none select-none blur-sm">{children}</div>
    <div className="absolute inset-0 flex justify-center bg-background/40 px-4 pt-24">
      <div role="status" aria-live="polite" className="sticky top-24 h-fit rounded-panel border border-border bg-card px-12 py-8 text-center shadow-lg">
        <h2 className="font-heading text-2xl font-semibold text-foreground">Coming Soon</h2>
      </div>
    </div>
  </div>;
}