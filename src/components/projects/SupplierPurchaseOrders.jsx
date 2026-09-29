import React from 'react';
import { formatCurrency, formatDate } from '@/lib/portal';
import { ExternalLink } from 'lucide-react';

export default function SupplierPurchaseOrders({ orders, project }) {
  if (!orders.length) return <div className="rounded-xl border border-dashed border-border bg-card py-12 text-center text-sm text-muted-foreground">No purchase orders linked to your supplier account for this project.</div>;
  return <div className="space-y-3">{orders.map(po => <article key={po.id} className="rounded-xl border border-border bg-card p-5">
    <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-semibold text-foreground">{po.po_number || 'Purchase order'}</h3><span className="text-sm text-muted-foreground">{po.approval_status || 'Status not recorded'}</span></div>
    <p className="mt-2 text-sm text-muted-foreground">Legal project: {project.project_number || '—'} · PO project: {po.project_ref || '—'}</p>
    <p className="mt-2 text-sm text-foreground">{po.total_net_value != null ? formatCurrency(po.total_net_value) : 'Value not recorded'} · Approved {formatDate(po.approval_date)} · Sent {formatDate(po.sent_date)}</p>
    {po.notes && <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{po.notes}</p>}
    <div className="mt-3 flex flex-wrap gap-4">{[['attachment','View PO'],['supporting_documentation','Supporting documentation']].map(([key,label]) => /^https:\/\//i.test(po[key] || '') && <a key={key} href={po[key]} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"><ExternalLink className="h-4 w-4" />{label}</a>)}</div>
  </article>)}</div>;
}