import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
export default function useHandoverRegister(projectId, itemKey, open, onAction) {
  const [config, setConfig] = useState(null), [draft, setDraft] = useState({ summary: {}, rows: [] }), [loading, setLoading] = useState(false), [error, setError] = useState('');
  useEffect(() => {
    if (!open) return;
    let active = true; setLoading(true); setError(''); setConfig(null);
    base44.functions.invoke('manageHandoverPack', { action: 'register', projectId, key: itemKey }).then(({ data }) => { if (data.error) throw new Error(data.error); if (active) { setConfig(data.config); setDraft(data.register); } }).catch(err => { if (active) setError(err.response?.data?.error || err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, projectId, itemKey]);
  const save = async () => {
    setLoading(true); setError('');
    try { await onAction('save_register', { key: itemKey, register: draft }); return true; }
    catch (err) { setError(err.response?.data?.error || err.message); return false; }
    finally { setLoading(false); }
  };
  const download = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await base44.functions.invoke('manageHandoverPack', { action: 'export_register', projectId, key: itemKey });
      if (data.error) throw new Error(data.error);
      const url = URL.createObjectURL(new Blob([Uint8Array.from(atob(data.content), c => c.charCodeAt(0))], { type: data.mime }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = data.filename; document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) { setError(err.response?.data?.error || err.message); }
    finally { setLoading(false); }
  };
  return { config, draft, setDraft, loading, error, save, download };
}