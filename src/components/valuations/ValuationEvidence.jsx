import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDateTime } from '@/lib/portal';

const TYPES = ['NOP','Valuation Schedule','Contractor Application','Progress Report','Site Photographs','Variation Schedule','Supporting Invoices','Materials on Site Evidence','Programme','Other Supporting Documentation'];
export default function ValuationEvidence({ value, editable, onAction }) {
  const [type, setType] = useState(TYPES[0]); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const upload = async e => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 20 * 1024 * 1024) { setError('Maximum file size is 20 MB'); e.target.value = ''; return; } setBusy(true); setError(''); try { const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file }); const result = await onAction('attachment', { file_uri, name: file.name, type, size: file.size }); if (!result) setError('Unable to attach evidence. Please try again.'); } catch (err) { setError(err.response?.data?.error || err.message); } finally { setBusy(false); e.target.value = ''; } };
  const open = async uri => { setError(''); try { const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri }); window.open(signed_url, '_blank', 'noopener,noreferrer'); } catch (err) { setError(err.message); } };
  const hasNOP = (value.attachments || []).some(file => file.type === 'NOP' && file.file_uri);
  return <section className="rounded-2xl border border-border bg-card p-5"><h3 className="font-heading font-semibold text-als-navy">Supporting documents</h3>
    <p className="mt-1 text-xs text-muted-foreground">NOP document {hasNOP ? 'uploaded' : 'required before submission'}.</p>
    {editable && <div className="mt-3 flex flex-wrap items-center gap-2"><select value={type} onChange={e => setType(e.target.value)} className="rounded-lg border border-border bg-card p-2 text-sm">{TYPES.map(t => <option key={t}>{t}</option>)}</select><label className="cursor-pointer rounded-lg bg-als-navy px-3 py-2 text-sm text-white">{busy ? 'Uploading…' : '+ Choose file'}<input hidden type="file" disabled={busy} onChange={upload} /></label><label className="cursor-pointer rounded-lg border border-als-navy px-3 py-2 text-sm text-als-navy">Take photo<input hidden type="file" accept="image/*" capture="environment" disabled={busy} onChange={upload} /></label></div>}
    {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    <div className="mt-3 space-y-2">{(value.attachments || []).map((file,i) => <div key={i} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 text-sm"><div><p className="font-medium">{file.name}</p><p className="text-xs text-muted-foreground">{file.type} · {file.actor} · {formatDateTime(file.at)} · {Math.round((file.size || 0) / 1024)} KB</p></div><button onClick={() => open(file.file_uri)} className="font-medium text-als-navy-light underline">Preview / download</button></div>)}{!value.attachments?.length && <p className="text-sm text-muted-foreground">No documents uploaded.</p>}</div>
  </section>;
}