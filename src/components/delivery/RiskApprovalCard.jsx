import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { formatDate } from '@/lib/portal';
export default function RiskApprovalCard({ party, value, saved, onChange, disabled, readOnly }) {
  const Icon = value.approved ? CheckCircle2 : Circle;
  return <div className="space-y-3 rounded-lg border border-border bg-card p-4">
    <div className="flex items-center justify-between gap-2"><span className="text-sm font-bold">{party.label}</span><Icon className={value.approved ? 'h-4 w-4 text-success' : 'h-4 w-4 text-muted-foreground'} /></div>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!value.approved} disabled={disabled || readOnly} onChange={event => onChange({ ...value, approved: event.target.checked })} className="h-4 w-4 accent-primary" />Approved</label>
    {readOnly ? <p className="text-xs text-muted-foreground">{value.approved ? value.approver_name : 'Approval outstanding'}</p> : <label className="block space-y-1"><span className="text-xs text-muted-foreground">Approver name{value.approved ? ' (required)' : ''}</span><input aria-label={`${party.label} approver name`} value={value.approver_name || ''} required={!!value.approved} maxLength={200} disabled={disabled} onChange={event => onChange({ ...value, approver_name: event.target.value })} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" /></label>}
    {saved?.recorded_at && <p className="text-[10px] text-muted-foreground">{saved.approved ? 'Approval' : 'Status'} recorded {formatDate(saved.recorded_at)} by {saved.recorded_by}</p>}
  </div>;
}