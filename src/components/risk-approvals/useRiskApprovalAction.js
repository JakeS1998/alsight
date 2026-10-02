import { useState } from 'react';
import { base44 } from '@/api/base44Client';
export default function useRiskApprovalAction(onSuccess) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async payload => {
    setBusy(true); setError('');
    try {
      const { data } = await base44.functions.invoke('manageRiskApprovals', payload);
      if (data.error) throw new Error(data.error);
      await onSuccess?.(data, payload);
      return data;
    } catch (e) { setError(e.response?.data?.error || e.data?.error || e.message || 'Unable to process this approval.'); return null; }
    finally { setBusy(false); }
  };
  return { run, busy, error };
}