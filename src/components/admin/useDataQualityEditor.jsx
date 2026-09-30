import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
export default function useDataQualityEditor(target, check, onSaved, onClose) {
  const [editor, setEditor] = useState(null), [values, setValues] = useState({}), [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => {
    if (!target) return;
    let active = true; setEditor(null); setBusy(true); setError('');
    base44.functions.invoke('getDataQuality', { action: 'editor', check, recordId: target.recordId, entity: target.entity }).then(({ data }) => { if (data.error) throw new Error(data.error); if (active) { setEditor(data); setValues(data.values); } }).catch(err => { if (active) setError(err.response?.data?.error || err.message); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [target, check]);
  const save = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const { data } = await base44.functions.invoke('getDataQuality', { action: 'save', check, recordId: target.recordId, entity: target.entity, version: editor.version, values });
      if (data.error) throw new Error(data.error);
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.error || err.message); }
    finally { setBusy(false); }
  };
  return { editor, values, setValues, busy, error, save };
}