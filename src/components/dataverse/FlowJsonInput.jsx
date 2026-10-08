import React, { useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
export default function FlowJsonInput({ id, value, disabled, onChange }) {
  const [text, setText] = useState('');
  useEffect(() => { setText(value == null ? '' : JSON.stringify(value, null, 2)); }, [value]);
  const update = event => {
    const next = event.target.value;
    setText(next);
    try { const parsed = next.trim() ? JSON.parse(next) : null; event.target.setCustomValidity(''); onChange(parsed); }
    catch { event.target.setCustomValidity('Enter valid JSON before saving.'); }
  };
  return <Textarea id={id} disabled={disabled} value={text} maxLength={10000} onChange={update} placeholder="Enter valid JSON" />;
}