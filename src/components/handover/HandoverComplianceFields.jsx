import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import HandoverRecipientInput from '@/components/handover/HandoverRecipientInput';

export default function HandoverComplianceFields({ item, editable, busy, onAction }) {
  const [values, setValues] = useState(item.compliance_details || {});
  useEffect(() => setValues(item.compliance_details || {}), [item.compliance_details]);
  if (!item.complianceFields?.length || item.status === 'not_applicable') return null;
  const disabled = busy || !editable;
  return <div className="space-y-3 rounded-lg border border-border p-3">
    <p className="text-sm font-medium">Statutory issue / receipt record</p>
    <p className="text-xs text-muted-foreground">Save the record, attach or reference the actual issued information, then review completion. Entries alone do not certify accuracy, sufficiency or statutory deadlines.</p>
    <div className="grid gap-3 sm:grid-cols-2">{item.complianceFields.map(field => <label key={field.key} className="block text-xs">{field.label}
      {field.type === 'contact' ? <HandoverRecipientInput value={values[field.key]} name={values.recipient_name} label={field.label} disabled={disabled} onChange={value => setValues(old => ({ ...old, [field.key]: value }))} /> : field.type === 'select' ? <select disabled={disabled} value={values[field.key] || ''} onChange={e => setValues(old => ({ ...old, [field.key]: e.target.value }))} className="mt-1 block w-full rounded border border-input bg-background p-2 text-sm"><option value="">Not recorded</option>{field.options.map(option => <option key={option}>{option}</option>)}</select> : <input type={field.type} disabled={disabled} maxLength={1000} value={values[field.key] || ''} onChange={e => setValues(old => ({ ...old, [field.key]: e.target.value }))} className="mt-1 block w-full rounded border border-input bg-background p-2 text-sm" />}
    </label>)}</div>
    {editable && <Button size="sm" variant="outline" disabled={busy} onClick={() => onAction('compliance', { key: item.key, details: values }).catch(() => {})}>Save issue / receipt record</Button>}
  </div>;
}