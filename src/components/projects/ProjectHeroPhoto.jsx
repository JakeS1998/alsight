import React, { useEffect, useState } from 'react';
import { Image } from '@/components/ui/image';
import { Loader2, ImageOff, RefreshCw } from 'lucide-react';
export default function ProjectHeroPhoto({ photo, project }) {
  const [imageState, setImageState] = useState('loading');
  const url = photo.data?.url;
  useEffect(() => {
    if (!url || imageState !== 'loading') return;
    const timer = setTimeout(() => setImageState('error'), 30000);
    return () => clearTimeout(timer);
  }, [url, imageState]);
  const searching = photo.isFetching;
  const loading = searching || (!!url && imageState === 'loading');
  const failed = photo.isError || (!!url && imageState === 'error');
  const message = searching ? 'Finding project image…' : loading ? 'Loading project image…' : failed ? 'Project image could not be loaded.' : !url ? 'No project image found.' : null;
  return <>
    {url && imageState !== 'error' && <Image className="ws-heroimg" src={url} alt={photo.data.caption || `${project.name} project photograph`} loading="eager" onLoad={() => setImageState('loaded')} onError={() => setImageState('error')} />}
    {message && <div className="ws-image-status" role="status" aria-live="polite">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ImageOff className="h-4 w-4" aria-hidden="true" />}
      <span>{message}</span>
      {!loading && <button type="button" className="inline-flex items-center gap-1 font-semibold underline underline-offset-2" onClick={photo.retryPhoto}><RefreshCw className="h-3 w-3" aria-hidden="true" />Retry image</button>}
    </div>}
  </>;
}