import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
export default function useValuationDocuments(value) {
  const [busy, setBusy] = useState(''), [error, setError] = useState('');
  const [issues, setIssues] = useState([]), [loading, setLoading] = useState(true);
  const [canIssue, setCanIssue] = useState(false), [cursor, setCursor] = useState(null), [hasMore, setHasMore] = useState(false);
  const invoke = async extra => { const { data } = await base44.functions.invoke('exportValuation', { valuationId: value.id, projectId: value.project_id, ...extra }); if (data.error) throw new Error(data.error); return data; };
  const fail = err => setError(err.response?.data?.error || err.message || 'Unable to generate document');
  const load = async (more = false) => {
    setLoading(true);
    try { const data = await invoke({ action: 'history', ...(more && cursor ? { cursor } : {}) }); setIssues(previous => more ? [...previous, ...data.items] : data.items); setCanIssue(data.canIssue); setCursor(data.next_cursor); setHasMore(data.has_more); }
    catch (err) { fail(err); } finally { setLoading(false); }
  };
  useEffect(() => { setIssues([]); setCanIssue(false); load(); }, [value.id, value.status]);
  const generate = async (type, extra = {}) => {
    if (busy) return false;
    setBusy(type); setError('');
    try {
      const data = await invoke({ documentType: type, ...extra });
      const binary = atob(data.content), bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = data.filename;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      if (extra.action === 'issue') await load();
      return true;
    } catch (err) { fail(err); return false; } finally { setBusy(''); }
  };
  const copy = async issueId => {
    if (busy) return;
    setBusy(issueId); setError('');
    try { const data = await invoke({ action: 'copy', issueId }); const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: data.file_uri }); const a = document.createElement('a'); a.href = signed_url; a.download = data.filename; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); }
    catch (err) { fail(err); } finally { setBusy(''); }
  };
  return { busy, error, issues, loading, canIssue, hasMore, generate, copy, more: () => load(true), clearError: () => setError('') };
}