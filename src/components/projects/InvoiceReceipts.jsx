import React from 'react';
import { formatCurrency, formatDate } from '@/lib/portal';

export default function InvoiceReceipts({ invoices, loading, error }) {
  return <section className="overflow-hidden rounded-2xl border border-border bg-card">
    <div className="border-b border-border px-5 py-4">
      <h3 className="font-heading text-base font-semibold text-card-foreground">Invoices</h3>
      <p className="text-xs text-muted-foreground">Client payments received</p>
    </div>
    {loading ? <p className="px-5 py-4 text-sm text-muted-foreground">Loading invoices…</p> : error ? <p role="alert" className="px-5 py-4 text-sm text-destructive">Could not load invoices.</p> : invoices.length === 0 ? <p className="px-5 py-4 text-sm text-muted-foreground">No paid invoices recorded for this project.</p> :
      <div className="divide-y divide-border">
        {[...invoices].sort((a, b) => b.paid_date.localeCompare(a.paid_date)).map(invoice =>
          <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
            <div><p className="font-medium text-card-foreground">{invoice.invoice_number} {invoice.sample && <span className="text-xs text-muted-foreground">· Sample</span>}</p>
              <p className="text-xs text-muted-foreground">{invoice.client_name || 'Client'} · Paid {formatDate(invoice.paid_date)}</p></div>
            <span className="font-semibold text-card-foreground">{formatCurrency(invoice.amount)}</span>
          </div>
        )}
      </div>}
  </section>;
}