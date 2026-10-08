import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import dataverseUserRequest from '@/components/dataverse/dataverseClient';

export default function useDataverseUser() {
  const { user } = useAuth();
  const cache = useQueryClient();
  const queryKey = ['personal-dataverse', user?.id];
  const query = useQuery({ queryKey, queryFn: () => dataverseUserRequest('status'), enabled: Boolean(user), retry: false });
  const [busy, setBusy] = useState(''), [error, setError] = useState(''), [notice, setNotice] = useState('');
  async function run(action) {
    setBusy(action); setError(''); setNotice('');
    try {
      const result = await dataverseUserRequest(action);
      if (action === 'begin') { window.location.assign(result.authorization_url); return; }
      cache.setQueryData(queryKey, result);
      setNotice(action === 'check' ? 'Your Dataverse user access is confirmed.' : 'Your Dataverse account has been disconnected from ALSight.');
    } catch (failure) { setError(failure.message); }
    finally { setBusy(''); }
  }
  return { connection: query.data, loading: query.isPending, loadError: query.error?.message, reload: query.refetch, busy, error, notice, run };
}