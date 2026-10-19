import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import InlineEditTrigger from '@/components/forms/InlineEditTrigger';
import { Button } from '@/components/ui/button';
import FlowFieldInput from '@/components/dataverse/FlowFieldInput';
export default function FlowEditableField({ field, value, disabled, resetKey, onChange, onCancel }) {
  const [editing, setEditing] = useState(false), container = useRef(null);
  const label = field.local.replaceAll('_', ' ');
  useEffect(() => { setEditing(false); }, [resetKey]);
  useEffect(() => { if (editing) container.current?.querySelector('input, textarea, select')?.focus(); }, [editing]);
  const cancel = () => { onCancel(); setEditing(false); };
  const display = value == null || value === '' ? 'Not set' : field.choiceOptions?.find(option => String(option.value) === String(value))?.label ?? (typeof value === 'boolean' ? value ? 'Yes' : 'No' : typeof value === 'object' ? JSON.stringify(value) : String(value));
  if (field.write && !editing) return <div className="space-y-1"><p className="flex min-h-7 items-center text-sm font-medium capitalize">{label}</p><InlineEditTrigger label={label} disabled={disabled} onEdit={() => setEditing(true)} className="min-h-9 text-sm"><span className="whitespace-pre-wrap break-words">{display}</span></InlineEditTrigger></div>;
  return <div ref={container}>
    <FlowFieldInput field={field} value={value} disabled={disabled || !editing} onChange={onChange}
      labelAction={editing && <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" disabled={disabled}
        aria-label={`Cancel editing ${label}`} title="Cancel field changes" onClick={cancel}><X className="h-3.5 w-3.5" /></Button>} />
  </div>;
}