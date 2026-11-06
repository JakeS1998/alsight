import React, { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AliceDocumentAttachment({ document }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const download = async () => {
    setBusy(true); setError('');
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: document.file_uri, expires_in: 300 });
      const response = await fetch(signed_url);
      if (!response.ok) throw new Error('Download failed');
      const url = URL.createObjectURL(await response.blob());
      const link = window.document.createElement('a'); link.href = url; link.download = document.filename;
      window.document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch { setError('Unable to download this document. Please try again.'); }
    finally { setBusy(false); }
  };
  return <div className="mt-3 rounded-lg border border-border bg-card p-3">
    <div className="flex items-center gap-2"><FileText className="h-5 w-5 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1 break-words text-sm font-medium">{document.filename}</span>
      <button type="button" onClick={download} disabled={busy} aria-label={`Download ${document.filename}`} className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{busy ? 'Downloading' : 'Download'}</button></div>
    {error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
  </div>;
}