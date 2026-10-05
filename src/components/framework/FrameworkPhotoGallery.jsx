import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import FrameworkPhoto from '@/components/framework/FrameworkPhoto';

export default function FrameworkPhotoGallery({ reportId, canEdit }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [more, setMore] = useState(false);
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = async (next = null) => {
    setLoading(true);
    const page = await base44.entities.FrameworkProjectPhoto.filter({ report_id: reportId }, { sort: '-created_date', limit: 50, ...(next ? { cursor: next } : {}) }).finally(() => setLoading(false));
    setPhotos(previous => next ? [...previous, ...page.items] : page.items);
    setCursor(page.next_cursor); setMore(page.has_more);
  };
  useEffect(() => { setPhotos([]); setError(''); load().catch(() => setError('Unable to load photos.')); }, [reportId]);
  const upload = async e => {
    e.preventDefault(); if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || file.size > 10 * 1024 * 1024) { setError('Choose a JPG, PNG, WebP or GIF image under 10 MB.'); return; }
    setBusy(true); setError('');
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      await base44.entities.FrameworkProjectPhoto.create({ report_id: reportId, file_uri, caption: caption.trim().slice(0, 160) });
      setFile(null); setCaption(''); e.target.reset(); await load();
    } catch { setError('Unable to add the photo. Please try again.'); }
    finally { setBusy(false); }
  };
  const remove = async id => {
    setBusy(true); setError('');
    try { await base44.entities.FrameworkProjectPhoto.delete(id); await load(); }
    catch { setError('Unable to remove the photo.'); }
    finally { setBusy(false); }
  };
  return <section className="space-y-4"><h2 className="text-lg font-semibold text-als-navy">Project images</h2>
    {canEdit && <form onSubmit={upload} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"><label className="text-sm">Add an image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e => setFile(e.target.files?.[0] || null)} className="mt-1 block text-sm" /></label><label className="inline-flex h-9 cursor-pointer items-center rounded-md border border-input px-3 text-sm font-medium sm:hidden">Take photo<input type="file" accept="image/*" capture="environment" disabled={busy} onChange={e => setFile(e.target.files?.[0] || null)} className="sr-only" /></label><label className="text-sm">Caption<input value={caption} onChange={e => setCaption(e.target.value)} maxLength={160} placeholder="Optional caption" className="mt-1 block h-9 rounded-md border border-input px-3" /></label><button type="submit" disabled={busy || !file} className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">{busy ? 'Adding…' : 'Add image'}</button></form>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {loading && <p role="status" className="text-sm text-muted-foreground">Loading project images…</p>}
    {photos.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{photos.map(photo => <FrameworkPhoto key={photo.id} photo={photo} canEdit={canEdit} onDelete={remove} />)}</div> : !loading && !error && <p className="text-sm text-muted-foreground">No project images have been added yet.</p>}
    {more && <button type="button" disabled={busy} onClick={() => load(cursor).catch(() => setError('Unable to load more photos.'))} className="rounded-lg border border-input px-4 py-2 text-sm">Load more images</button>}
  </section>;
}