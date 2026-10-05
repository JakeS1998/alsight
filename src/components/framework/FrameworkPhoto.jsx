import React, { useEffect, useState } from 'react';
import { Image } from '@/components/ui/image';
import { base44 } from '@/api/base44Client';
import { Loader2, ImageOff } from 'lucide-react';

export default function FrameworkPhoto({ photo, canEdit, onDelete }) {
  const [url, setUrl] = useState('');
  const [imageState, setImageState] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true; setUrl(''); setImageState('loading');
    base44.integrations.Core.CreateFileSignedUrl({ file_uri: photo.file_uri, expires_in: 3600 }).then(({ signed_url }) => { if (active) setUrl(signed_url); }).catch(() => { if (active) setUrl('unavailable'); });
    return () => { active = false; };
  }, [photo.file_uri, attempt]);
  useEffect(() => {
    if (!url || url === 'unavailable' || imageState !== 'loading') return;
    const timer = setTimeout(() => setImageState('error'), 30000);
    return () => clearTimeout(timer);
  }, [url, imageState]);
  const unavailable = url === 'unavailable' || imageState === 'error';
  return <figure className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <div className="relative h-48 bg-secondary">
      {url && !unavailable && <a href={url} target="_blank" rel="noreferrer"><Image key={`${url}:${attempt}`} src={url} alt={photo.caption || 'UKLF project photograph'} className="h-48 w-full object-cover" onLoad={() => setImageState('loaded')} onError={() => setImageState('error')} /></a>}
      {(unavailable || imageState !== 'loaded') && <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-secondary text-sm text-muted-foreground">
        {unavailable ? <><ImageOff className="h-5 w-5" aria-hidden="true" /><span>Photo unavailable</span><button type="button" onClick={() => setAttempt(value => value + 1)} className="font-medium underline underline-offset-2">Retry photo</button></> : <><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /><span>Loading photo…</span></>}
      </div>}
    </div>
    <figcaption className="flex items-center justify-between gap-2 p-3 text-sm"><span>{photo.caption || 'Project photograph'}</span>{canEdit && <button type="button" onClick={() => onDelete(photo.id)} className="text-xs text-destructive hover:underline">Remove</button>}</figcaption>
  </figure>;
}