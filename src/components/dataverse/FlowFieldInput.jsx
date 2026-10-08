import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
export default function FlowFieldInput({ field, value, onChange, disabled }) {
  const id = `flow-edit-${field.local}`, type = field.localType;
  const controlProps = { id, disabled: disabled || !field.write, value: value ?? '' };
  return <div className="space-y-1"><label htmlFor={id} className="block text-sm font-medium capitalize">{field.local.replaceAll('_', ' ')}{!field.write && <span className="ml-2 text-xs text-muted-foreground">Read only</span>}</label>
    {type === 'Boolean' ? <select {...controlProps} value={value === null ? '' : String(value)} className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm" onChange={e => onChange(e.target.value === '' ? null : e.target.value === 'true')}><option value="">Not set</option><option value="true">Yes</option><option value="false">No</option></select> : type === 'Memo' ? <Textarea {...controlProps} maxLength={4000} onChange={e => onChange(e.target.value)} /> : <Input {...controlProps} type={type === 'DateTime' ? 'datetime-local' : ['Money', 'Decimal', 'Double', 'Integer', 'BigInt'].includes(type) ? 'number' : 'text'} step="any" maxLength={500} value={type === 'DateTime' && value ? String(value).slice(0, 16) : type === 'Json' && value != null ? JSON.stringify(value) : value ?? ''} onChange={e => onChange(type === 'DateTime' ? e.target.value ? new Date(`${e.target.value}Z`).toISOString() : null : ['Money', 'Decimal', 'Double', 'Integer', 'BigInt'].includes(type) ? e.target.value === '' ? null : Number(e.target.value) : e.target.value)} />}
    {type === 'DateTime' && <p className="text-xs text-muted-foreground">Date and time shown in UTC.</p>}
  </div>;
}