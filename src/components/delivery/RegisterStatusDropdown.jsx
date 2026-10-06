import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

export default function RegisterStatusDropdown({ entityName, row, options, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const update = async status => {
    if (status === row.status || saving) return;
    setSaving(true); setError('');
    try {
      await base44.entities[entityName].update(row.id, { status });
      if (entityName === 'ProjectAction') window.dispatchEvent(new Event('alsight-tasks-changed'));
      await onSaved();
    } catch (e) { setError(e.message || 'Unable to update status.'); }
    finally { setSaving(false); }
  };
  return <div className="min-w-[140px]">
    <div className="flex items-center gap-2">
      <select aria-label={`Status for ${row.action || row.decision_title || row.title || 'register entry'}`} value={row.status || ''} disabled={saving} onChange={e => update(e.target.value)} className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
        {!options.some(option => option.value === row.status) && <option value={row.status || ''} disabled>{row.status || 'Select status'}</option>}
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {saving && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-label="Saving status" role="status" />}
    </div>
    {error && <p role="alert" className="mt-1 text-xs text-destructive">{error}</p>}
  </div>;
}