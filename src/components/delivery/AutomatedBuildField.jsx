import React from 'react';
import { Pencil, RotateCcw } from 'lucide-react';
import { FormField, formInputClass } from '@/components/forms/PowerForm';
import { Button } from '@/components/ui/button';
export default function AutomatedBuildField({ label, field, type = 'text', options, value, delivery, setField, help }) {
  const manual = !!delivery[`${field}_override`];
  const toggle = () => {
    if (!manual) setField(field, value ?? '');
    setField(`${field}_override`, !manual);
  };
  return <div className="space-y-1">
    <FormField label={label}>
      <div className="flex gap-2">
        {options ? <select aria-label={label} disabled={!manual} value={value || ''} onChange={e => setField(field, e.target.value)} className={formInputClass}>
          <option value="">Not enough information</option>{options.map(option => <option key={option} value={option}>{option}</option>)}
        </select> : <input aria-label={label} type={type} min={type === 'number' ? 0 : undefined} max={type === 'number' ? 100 : undefined} step={type === 'number' ? '0.1' : undefined} readOnly={!manual} value={value ?? ''} onChange={e => setField(field, e.target.value)} className={formInputClass} />}
        <Button type="button" variant="outline" size="icon" onClick={toggle} aria-label={`${manual ? 'Use automatic value for' : 'Override'} ${label}`} title={manual ? 'Return to automatic' : 'Override'}>{manual ? <RotateCcw /> : <Pencil />}</Button>
      </div>
    </FormField>
    <p className="text-xs text-muted-foreground">{manual ? 'Manual override. Save construction to retain it.' : `Automatic. ${help}`}</p>
  </div>;
}