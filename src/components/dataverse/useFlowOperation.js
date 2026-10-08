import { useState } from 'react';
import flowRequest from '@/components/dataverse/flowClient';
export default function useFlowOperation() {
  const [busy, setBusy] = useState(''), [error, setError] = useState(''), [notice, setNotice] = useState('');
  async function run(action, input = {}) {
    setBusy(action); setError(''); setNotice('');
    try { const result = await flowRequest(action, input); setNotice(result.notice || ''); return result; }
    catch (failure) { setError(failure.message); return null; }
    finally { setBusy(''); }
  }
  return { run, busy, error, notice };
}