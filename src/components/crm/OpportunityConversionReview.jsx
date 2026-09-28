import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/portal';
export default function OpportunityConversionReview({ open, onClose, onConfirm, item, account, contacts, busy }) {
  const contact = contacts.find(c => c.id === item.contact_id);
  return <Dialog open={open} onOpenChange={value => !value && onClose()}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Review project handover</DialogTitle></DialogHeader>
    <p className="text-sm text-muted-foreground">Confirm the details that will move into the new ALS Live project. The client and contact remain linked to their existing records.</p>
    <dl className="grid gap-3 text-sm sm:grid-cols-2">{[['Project', item.title], ['Client', account.name], ['Location', item.location || '—'], ['Postcode', item.site_postcode || '—'], ['Project value', formatCurrency(item.confirmed_project_value ?? item.budget)], ['Alliance fee', formatCurrency(item.confirmed_alliance_fee ?? item.alliance_fee)], ['Primary contact', contact?.full_name || '—'], ['Owner', item.owner_name || '—'], ['Expected programme', item.target_programme || '—'], ['Scope', item.scope_summary || item.project_details || '—'], ['Confirmed consultants', item.design_team?.filter(m => m.status === 'confirmed').map(m => m.supplier_name || m.role).join(', ') || '—'], ['Fee proposal', item.fee_status || '—']].map(([label,value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="font-medium">{value}</dd></div>)}</dl>
    <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={busy} onClick={onConfirm}>{busy ? 'Creating…' : 'Create ALS Live Project'}</Button></div>
  </DialogContent></Dialog>;
}