import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import flowRequest from '@/components/dataverse/flowClient';
export default function useInlineDataverseField(context, name) {
  const cache = useQueryClient();
  const [open, setOpen] = useState(false), [loaded, setLoaded] = useState(null), [value, setValue] = useState(null);
  const [busy, setBusy] = useState(''), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const start = async () => {
    setOpen(true); setLoaded(null); setBusy('load'); setError(''); setNotice('');
    try {
      const data = await flowRequest('load', { table: context.table, recordId: context.record.id });
      if (!data.fields.some(field => field.local === name && field.write)) throw new Error('This field is no longer enabled for write-back.');
      setLoaded(data); setValue({ ...data.values, ...data.choiceValues }[name]);
    } catch (failure) { setError(failure.message); }
    finally { setBusy(''); }
  };
  const save = async () => {
    setBusy('save'); setError(''); setNotice('');
    try {
      const data = await flowRequest('save', { table: context.table, recordId: context.record.id, etag: loaded.etag, values: { [name]: value } });
      setNotice(data.notice || 'Saved to Dataverse.');
      setOpen(false); setLoaded(null);
      if (!data.refreshRequired) {
        try { await context.saved(data); }
        catch { setNotice(`${data.notice || 'Saved to Dataverse.'} Reload the page to view the updated record.`); }
      }
      cache.invalidateQueries();
    } catch (failure) { setError(failure.message); }
    finally { setBusy(''); }
  };
  const cancel = () => { setOpen(false); setLoaded(null); setError(''); setNotice(''); };
  const initial = loaded ? { ...loaded.values, ...loaded.choiceValues }[name] : null;
  return { open, field: loaded?.fields.find(field => field.local === name), value, setValue, busy, error, notice, start, save, cancel, changed: loaded && value !== initial };
}