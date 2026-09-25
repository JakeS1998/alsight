import React from 'react';
import { formatCurrency, formatDate } from '@/lib/portal';

export default function InvoiceReceipts({ invoices }) {
  return <div className="space-y-2">
    <h4 className="text-sm font-semibold text-card-foreground">Client payments received</h4>
    {invoices.length === 0 ? <p className="text-sm text-muted-foreground">No paid invoices recorded for this project.</p> :
      <div className="divide-y divide-border rounded-lg border border-border">
        {[...invoices].sort((a, b) => b.paid_date.localeCompare(a.paid_date)).map(invoice =>
          <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
            <div><p className="font-medium text-card-foreground">{invoice.invoice_number} {invoice.sample && <span className="text-xs text-muted-foreground">· Sample</span>}</p>
              <p className="text-xs text-muted-foreground">{invoice.client_name || 'Client'} · Paid {formatDate(invoice.paid_date)}</p></div>
            <span className="font-semibold text-card-foreground">{formatCurrency(invoice.amount)}</span>
          </div>
        )}
      </div>}
  </div>;
}