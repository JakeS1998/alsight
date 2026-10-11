import React from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
export default function CapacitySupplierDetail({supplier,onClose,id}) {
  return <section id={id} className="rounded-lg border border-border bg-card p-3">
    <div className="flex items-start justify-between gap-3">
      <div>{supplier.accountId ? <Link to={`/accounts/${supplier.accountId}`} className="text-sm font-semibold hover:underline">{supplier.name}</Link> : <h4 className="text-sm font-semibold">{supplier.name}</h4>}<p className="mt-1 text-xs text-muted-foreground">{supplier.classification}</p></div>
      <button type="button" onClick={onClose} aria-label="Close supplier details" className="rounded-md p-1 text-muted-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X className="h-4 w-4"/></button>
    </div>
    <p className="mt-3 text-xs">{supplier.active} active projects · {supplier.near} with commitments in 30 days · {supplier.demanding} late design / construction</p>
    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">{supplier.signals.map(signal=><li key={signal}>{signal}</li>)}</ul>
    {supplier.clashes.map(clash=><p key={clash.month} className="mt-2 text-xs text-muted-foreground">{clash.count} projects have commitments in {new Date(clash.month+'-01T12:00:00').toLocaleDateString('en-GB',{month:'long',year:'numeric'})}; consider coordination.</p>)}
  </section>;
}