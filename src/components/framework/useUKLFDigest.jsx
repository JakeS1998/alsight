import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
export default function useUKLFDigest() {
  const [settings, setSettings] = useState(null), [users, setUsers] = useState([]), [more, setMore] = useState(false);
  const [busy, setBusy] = useState('loading'), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const load = async (offset = 0) => {
    setBusy(offset ? 'more' : 'loading'); setError('');
    try {
      const { data } = await base44.functions.invoke('manageUKLFDigest', { action: 'get', offset });
      if (!offset) setSettings(data.settings);
      setUsers(previous => offset ? [...previous, ...data.users] : data.users); setMore(data.hasMore);
    } catch (failure) { setError(failure.response?.data?.error || 'Unable to load digest settings.'); }
    finally { setBusy(''); }
  };
  useEffect(() => { load(); }, []);
  const save = async event => {
    event.preventDefault(); setBusy('saving'); setError(''); setNotice('');
    try {
      const { data } = await base44.functions.invoke('manageUKLFDigest', { action: 'save', enabled: settings.enabled, selectedUserIds: settings.selected_user_ids });
      setSettings(data.settings); setNotice(settings.enabled ? 'Saved. The digest will run on the first of each month at 9am UK time.' : 'Saved. Monthly emails are paused.');
    } catch (failure) { setError(failure.response?.data?.error || 'Unable to save digest settings.'); }
    finally { setBusy(''); }
  };
  return { settings, setSettings, users, more, busy, error, notice, save, reload: () => load(), loadMore: () => load(users.length) };
}