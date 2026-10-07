import React from 'react';
import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Image} from '@/components/ui/image';

export default function PulseImage({image,className='aspect-[16/10] w-full'}) {
  const query=useQuery({queryKey:['pulse-private-image',image.file_uri],queryFn:()=>base44.integrations.Core.CreateFileSignedUrl({file_uri:image.file_uri,expires_in:900}),staleTime:600000,refetchInterval:720000,refetchOnWindowFocus:true});
  if(query.isPending) return <div role="status" className={`flex items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground ${className}`}>Loading image…</div>;
  if(query.error) return <div role="alert" className={`flex flex-col items-center justify-center gap-2 rounded-lg bg-muted text-xs text-muted-foreground ${className}`}><p>Image unavailable.</p><button type="button" className="underline" onClick={()=>query.refetch()}>Try again</button></div>;
  return <Image src={query.data.signed_url} alt={image.name || 'Shared Alliance image'} className={`rounded-lg bg-muted ${className}`} fittingType="fit"/>;
}