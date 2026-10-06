import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { FileCheck } from 'lucide-react';
export default function FeeProposalDocumentLink({ uri, children = 'View' }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const className = 'inline-flex items-center gap-1 text-sm text-primary hover:underline';
  if (!uri?.startsWith('mp/private/')) return <a href={uri} target="_blank" rel="noreferrer" className={className}><FileCheck className="h-4 w-4" />{children}</a>;
  const open = async () => {
    setBusy(true); setError('');
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri });
      const anchor = document.createElement('a'); anchor.href = signed_url; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; anchor.click();
    } catch { setError('Unable to open the proposal. Please try again.'); }
    finally { setBusy(false); }
  };
  return <span><button type="button" onClick={open} disabled={busy} className={className}><FileCheck className="h-4 w-4" />{busy ? 'Opening…' : children}</button>{error && <span role="alert" className="block text-xs text-destructive">{error}</span>}</span>;
}