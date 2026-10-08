import React, { useEffect, useRef, useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FlowFieldInput from '@/components/dataverse/FlowFieldInput';
export default function FlowEditableField({ field, value, disabled, resetKey, onChange, onCancel }) {
  const [editing, setEditing] = useState(false), container = useRef(null);
  const label = field.local.replaceAll('_', ' ');
  useEffect(() => { setEditing(false); }, [resetKey]);
  useEffect(() => { if (editing) container.current?.querySelector('input, textarea, select')?.focus(); }, [editing]);
  const cancel = () => { onCancel(); setEditing(false); };
  return <div ref={container}>
    <FlowFieldInput field={field} value={value} disabled={disabled || !editing} onChange={onChange}
      labelAction={<Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" disabled={disabled}
        aria-label={editing ? `Cancel editing ${label}` : `Edit ${label}`} title={editing ? 'Cancel field changes' : `Edit ${label}`}
        onClick={editing ? cancel : () => setEditing(true)}>
        {editing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
      </Button>} />
  </div>;
}