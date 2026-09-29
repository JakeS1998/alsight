import React from 'react';
import { formatCurrency, formatDate } from '@/lib/portal';

export default function SupplierPurchaseOrders({ orders, project }) {
  if (!orders.length) return <div className="rounded-xl border border-dashed border-border bg-card py-12 text-center text-sm text-muted-foreground">No purchase orders linked to your supplier account for this project.</div>;
  return <div className="space-y-3">{orders.map(po => <article key={po.id} className="rounded-xl border border-border bg-card p-5">
    <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-semibold text-foreground">{po.po_number || 'Purchase order'}</h3><span className="text-sm text-muted-foreground">{po.approval_status || 'Status not recorded'}</span></div>
    <p className="mt-2 text-sm text-muted-foreground">Legal project: {project.project_number || '—'} · PO project: {po.project_ref || '—'}</p>
    <p className="mt-2 text-sm text-foreground">{po.total_net_value != null ? formatCurrency(po.total_net_value) : 'Value not recorded'} · Approved {formatDate(po.approval_date)} · Sent {formatDate(po.sent_date)}</p>
  </article>)}</div>;
}