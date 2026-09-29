import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function AliceLookup({ type, value, onChange }) {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [more, setMore] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const pattern = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const query = type === 'client' ? { account_type: 'client', ...(pattern ? { name: { $regex: pattern, $options: 'i' } } : {}) } : { status: { $ne: 'inactive' }, ...(pattern ? { $or: [{ name: { $regex: pattern, $options: 'i' } }, { project_number: { $regex: pattern, $options: 'i' } }] } : {}) };
        const page = await base44.entities[type === 'client' ? 'Account' : 'Project'].filter(query, { sort: 'name', limit: 50, fields: type === 'client' ? ['name', 'dataverse_id'] : ['name', 'project_number', 'client_account_id', 'bdm_aad_id'] });
        if (active) { setItems(page.items); setMore(page.has_more); }
      } catch (e) { if (active) setError(e.message); }
      finally { if (active) setLoading(false); }
    }, search ? 250 : 0);
    return () => { active = false; clearTimeout(timer); };
  }, [type, search]);
  return <div className="space-y-2">
    <input type="search" aria-label={`Search ${type === 'client' ? 'clients' : 'projects'}`} placeholder={`Search ${type === 'client' ? 'clients' : 'projects'}…`} value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
    <select aria-label={`Choose ${type}`} value={value?.id || ''} onChange={e => onChange(items.find(item => item.id === e.target.value) || null)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
      <option value="">{loading ? 'Loading…' : `Select ${type}`}</option>
      {value && !items.some(item => item.id === value.id) && <option value={value.id}>{value.name}</option>}
      {items.map(item => <option key={item.id} value={item.id}>{item.name}{item.project_number ? ` · ${item.project_number}` : ''}</option>)}
    </select>
    {more && <p className="text-xs text-muted-foreground">Search to find more results.</p>}
    {!loading && !items.length && !error && <p className="text-xs text-muted-foreground">No matches found.</p>}
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </div>;
}