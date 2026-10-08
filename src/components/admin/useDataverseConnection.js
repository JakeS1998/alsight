import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { base44 } from '@/api/base44Client';

const queryKey = ['admin-dataverse-connection'];
async function request(action, values = {}) {
  const { data } = await base44.functions.invoke('manageDataverseConnection', { action, ...values });
  if (data.error) throw new Error(data.error);
  return data;
}
export default function useDataverseConnection() {
  const cache = useQueryClient();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const query = useQuery({ queryKey, queryFn: () => request('get'), retry: false });
  async function run(action, environment_url) {
    setBusy(action); setError(''); setNotice('');
    try {
      const result = await request(action, action === 'save' ? { environment_url } : {});
      cache.setQueryData(queryKey, result);
      setNotice(action === 'save' ? 'Environment saved. Connect your own Dataverse account in Account Settings.' : 'Your Dataverse user access is confirmed.');
    } catch (failure) {
      setError(failure?.response?.data?.error || failure.message || 'Unable to complete the connection request.');
      await cache.invalidateQueries({ queryKey });
    } finally { setBusy(''); }
  }
  return { connection: query.data?.connection, loading: query.isPending, loadError: query.error?.response?.data?.error || query.error?.message, reload: query.refetch, busy, error, notice, run };
}