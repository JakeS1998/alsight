import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function HandoverRecipientInput({ value, name, disabled, onChange, label }) {
  const [search, setSearch] = useState(''), [options, setOptions] = useState([]), [loading, setLoading] = useState(false), [error, setError] = useState('');
  useEffect(() => {
    if (disabled) return;
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const text = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const page = await base44.entities.Contact.filter({ status: 'active', ...(text ? { full_name: { $regex: text, $options: 'i' } } : {}) }, { sort: 'full_name', limit: 20, fields: ['full_name'] });
        if (active) setOptions(page.items);
      } catch { if (active) setError('Unable to load contacts.'); }
      finally { if (active) setLoading(false); }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [search, disabled]);
  return <div className="space-y-1">
    {!disabled && <input aria-label={`Search ${label}`} placeholder="Search contacts…" value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded border border-input bg-background p-2 text-sm" />}
    <select aria-label={label} value={value || ''} disabled={disabled} onChange={e => onChange(e.target.value)} className="w-full rounded border border-input bg-background p-2 text-sm">
      <option value="">Select contact</option>
      {value && !options.some(option => option.id === value) && <option value={value}>{name || 'Selected contact'}</option>}
      {options.map(option => <option key={option.id} value={option.id}>{option.full_name}</option>)}
    </select>
    {loading && <p role="status" className="text-xs text-muted-foreground">Loading contacts…</p>}{error && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </div>;
}