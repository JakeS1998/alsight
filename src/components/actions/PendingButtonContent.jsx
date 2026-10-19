import React from 'react';
import { Loader2 } from 'lucide-react';

export default function PendingButtonContent({ children }) {
  return <span className="inline-grid items-center justify-items-center" style={{ gap: 'inherit' }}>
    <span aria-hidden="true" className="invisible col-start-1 row-start-1 inline-flex items-center" style={{ gap: 'inherit' }}>{children}</span>
    <Loader2 aria-hidden="true" className="col-start-1 row-start-1 h-4 w-4 animate-spin" />
    <span className="sr-only">Working…</span>
  </span>;
}