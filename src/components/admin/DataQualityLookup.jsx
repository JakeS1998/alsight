import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
export default function DataQualityLookup({ lookup, value, onChange, disabled }) {
  const [search, setSearch] = useState(''), [options, setOptions] = useState([]), [loading, setLoading] = useState(false), [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true); setError('');
      base44.functions.invoke('getDataQuality', { action: 'lookup', lookup, search, value }).then(({ data }) => { if (data.error) throw new Error(data.error); if (active) setOptions(data.options); }).catch(err => { if (active) setError(err.response?.data?.error || err.message); }).finally(() => { if (active) setLoading(false); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [lookup, search, value]);
  return <div className="mt-1 space-y-1"><input aria-label={`Search ${lookup}`} placeholder="Search by name…" value={search} disabled={disabled} onChange={e => setSearch(e.target.value)} className="w-full rounded border border-input bg-background p-2 text-sm" /><select aria-label={`Choose ${lookup}`} value={value || ''} disabled={disabled || loading} onChange={e => onChange(e.target.value)} className="w-full rounded border border-input bg-background p-2 text-sm"><option value="">{loading ? 'Loading…' : 'Not selected'}</option>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}{value && !options.some(option => option.value === value) && <option value={value}>Current assignment</option>}</select>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}<p className="text-xs text-muted-foreground">Search to find more matches.</p></div>;
}