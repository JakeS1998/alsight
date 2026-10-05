import React from 'react';
import ActionOwnerInput from '@/components/delivery/ActionOwnerInput';
export default function AliceTaskField({ field, value, onChange }) {
  if (field.type === 'owner') return <ActionOwnerInput value={value?.name || ''} onChange={(name, id) => onChange({ name, id })} />;
  if (field.type === 'choice') return <select aria-label={field.question} value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="">Choose an option</option>{field.options.map(option => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}</select>;
  return <input autoFocus aria-label={field.question} type={field.type === 'date' ? 'date' : 'number'} step={field.type === 'signed_number' ? '0.01' : undefined} value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />;
}