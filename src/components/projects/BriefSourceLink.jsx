import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function BriefSourceLink({ source }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const download = async () => {
    setBusy(true); setError('');
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: source.file_uri });
      const anchor = document.createElement('a'); anchor.href = signed_url; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; anchor.download = source.name; anchor.click();
    } catch { setError('Unable to open the source document. Please try again.'); }
    finally { setBusy(false); }
  };
  if (source.sharepoint_url) return <a href={source.sharepoint_url} target="_blank" rel="noreferrer" className="text-sm underline underline-offset-4">{source.name || 'SharePoint brief'}</a>;
  return <div><button type="button" disabled={busy} onClick={download} className="text-sm underline underline-offset-4 disabled:opacity-50">{busy ? 'Opening…' : source.name || 'Source document'}</button>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}</div>;
}