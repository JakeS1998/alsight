import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formInputClass } from '@/components/forms/PowerForm';

export default function ActionOwnerInput({ value, onChange }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) { setOptions([]); return; }
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const page = await base44.entities.Contact.filter({
          portal_role: { $in: ['admin', 'director', 'regional_director', 'bsm', 'bdm', 'finance', 'project_manager'] },
          full_name: { $regex: query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
        }, { sort: 'full_name', limit: 20, fields: ['full_name', 'aad_id'] });
        if (active) setOptions(page.items.filter(c => c.full_name?.trim().includes(' ')));
      } catch { if (active) setOptions([]); }
      finally { if (active) setLoading(false); }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [value]);
  return <div><input aria-label="Action owner full name" list="action-owner-names" value={value} onChange={e => onChange(e.target.value, options.find(c => c.full_name === e.target.value)?.aad_id || '')} className={formInputClass} placeholder="Search full name" /><datalist id="action-owner-names">{options.map(c => <option key={c.id} value={c.full_name} />)}</datalist>{loading && <span className="text-xs text-muted-foreground">Searching staff…</span>}{value.trim() && !value.trim().includes(' ') && <p className="text-xs text-destructive">Enter a full name, including surname.</p>}</div>;
}