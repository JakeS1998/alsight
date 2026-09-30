import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function useHandoverPack(projectId, savingDelivery, onStarted, enabled) {
  const [pack, setPack] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const sequence = useRef(0);
  const load = async () => {
    const id = ++sequence.current; setBusy(true); setError('');
    try { const { data } = await base44.functions.invoke('manageHandoverPack', { action: 'read', projectId }); if (data.error) throw new Error(data.error); if (id === sequence.current) setPack(data.pack); }
    catch (err) { if (id === sequence.current) setError(err.response?.data?.error || err.message); }
    finally { if (id === sequence.current) setBusy(false); }
  };
  useEffect(() => { if (enabled && !savingDelivery) load(); return () => { sequence.current++; }; }, [projectId, savingDelivery, enabled]);
  const action = async (name, values = {}) => {
    setBusy(true); setError('');
    try {
      const { data } = await base44.functions.invoke('manageHandoverPack', { action: name, projectId, ...values });
      if (data.error) throw new Error(data.error);
      setPack(data.pack);
      if (name === 'start') await onStarted();
      return data.pack;
    } catch (err) { setError(err.response?.data?.error || err.message); throw err; }
    finally { setBusy(false); }
  };
  const download = async format => {
    setBusy(true); setError('');
    try {
      const { data } = await base44.functions.invoke('manageHandoverPack', { action: 'export', projectId, format });
      if (data.error) throw new Error(data.error);
      const bytes = Uint8Array.from(atob(data.content), character => character.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: data.mime })), anchor = document.createElement('a');
      anchor.href = url; anchor.download = data.filename; document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) { setError(err.response?.data?.error || err.message); }
    finally { setBusy(false); }
  };
  return { pack, busy, error, load, action, download };
}