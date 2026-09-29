import React, { useEffect, useState } from 'react';
import { Image } from '@/components/ui/image';
import { base44 } from '@/api/base44Client';

export default function FrameworkPhoto({ photo, canEdit, onDelete }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let active = true;
    base44.integrations.Core.CreateFileSignedUrl({ file_uri: photo.file_uri, expires_in: 3600 }).then(({ signed_url }) => { if (active) setUrl(signed_url); }).catch(() => { if (active) setUrl('unavailable'); });
    return () => { active = false; };
  }, [photo.file_uri]);
  return <figure className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    {url && url !== 'unavailable' ? <a href={url} target="_blank" rel="noreferrer"><Image src={url} alt={photo.caption || 'UKLF project photograph'} className="h-48 w-full object-cover" /></a> : <div className="flex h-48 items-center justify-center bg-secondary text-sm text-slate-500">{url ? 'Photo unavailable' : 'Loading photo…'}</div>}
    <figcaption className="flex items-center justify-between gap-2 p-3 text-sm"><span>{photo.caption || 'Project photograph'}</span>{canEdit && <button type="button" onClick={() => onDelete(photo.id)} className="text-xs text-destructive hover:underline">Remove</button>}</figcaption>
  </figure>;
}