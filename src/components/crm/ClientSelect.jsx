import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function ClientSelect({ value, onChange }) {
  const [clients, setClients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    base44.entities.Account.count({ account_type: 'client' }).then(setTotal).catch(e => setError(e.message));
  }, []);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const name = search.trim();
        const query = { account_type: 'client', ...(name ? { name: { $regex: name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } } : {}) };
        const page = await base44.entities.Account.filter(query, { sort: 'name', limit: 50, fields: ['name'] });
        if (active) { setClients(page.items); setMore(page.has_more); }
      } catch (e) { if (active) setError(e.message); }
      finally { if (active) setLoading(false); }
    }, search ? 250 : 0);
    return () => { active = false; clearTimeout(timer); };
  }, [search]);
  return <div className="min-w-0 space-y-1">
    {total > 10 && <input aria-label="Search clients" type="search" placeholder="Search clients…" value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-lg border border-input bg-background p-2 text-sm" />}
    <select required aria-label="Client" value={value} onChange={e => { onChange(e.target.value); setSelected(clients.find(client => client.id === e.target.value) || null); }} className="w-full rounded-lg border border-input bg-background p-2 text-sm"><option value="">{loading ? 'Loading clients…' : 'Select client'}</option>{selected && !clients.some(client => client.id === selected.id) && <option value={selected.id}>{selected.name}</option>}{clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}</select>
    {more && <p className="text-xs text-muted-foreground">Search by name to see more clients.</p>}
    {!loading && !clients.length && !error && <p className="text-xs text-muted-foreground">No clients found.</p>}
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </div>;
}