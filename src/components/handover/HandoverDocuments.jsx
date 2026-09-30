import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

export default function HandoverDocuments({ item, editable, busy, onAction }) {
  const [version, setVersion] = useState('1'), [uploading, setUploading] = useState(false), [error, setError] = useState('');
  const upload = async event => {
    const file = event.target.files?.[0]; if (!file) return;
    setError('');
    if (file.size > 10 * 1024 * 1024 || !version.trim()) { setError('Choose a file up to 10 MB and enter its version.'); event.target.value = ''; return; }
    setUploading(true);
    try { const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file }); await onAction('attach', { key: item.key, file_uri, name: file.name, size: file.size, version }); }
    catch (err) { setError(err.response?.data?.error || err.message); }
    finally { setUploading(false); event.target.value = ''; }
  };
  const open = async file => {
    setError('');
    try { const url = file.file_uri ? (await base44.integrations.Core.CreateFileSignedUrl({ file_uri: file.file_uri })).signed_url : file.link; window.open(url, '_blank', 'noopener,noreferrer'); }
    catch (err) { setError(err.message); }
  };
  return <div className="space-y-2">
    {item.documents.map(file => <div key={file.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-xs">
      <div><button type="button" onClick={() => open(file)} className={`underline ${file.superseded ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{file.name}</button><p className="text-muted-foreground">{file.version ? `Version ${file.version} · ` : ''}{file.source}{file.at ? ` · ${file.actor} · ${new Date(file.at).toLocaleString('en-GB')}` : ''}{file.superseded ? ' · Superseded' : ''}</p></div>
      {editable && file.source === 'Uploaded evidence' && !file.superseded && <button type="button" disabled={busy || uploading} onClick={() => onAction('supersede', { key: item.key, documentId: file.id }).catch(() => {})} className="underline text-muted-foreground">Supersede</button>}
    </div>)}
    {editable && <div className="flex flex-wrap items-center gap-2"><label className="text-xs">Version <input aria-label={`${item.label} document version`} value={version} maxLength={40} onChange={event => setVersion(event.target.value)} className="ml-1 w-20 rounded border border-input bg-background p-1" /></label><Button asChild variant="outline" size="sm"><label className={busy || uploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}>{uploading ? 'Uploading…' : 'Upload document (optional)'}<input hidden type="file" accept=".pdf,.docx,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.dwg,.dxf" disabled={busy || uploading} onChange={upload} /></label></Button></div>}
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </div>;
}