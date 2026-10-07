import React from 'react';
import {useQuery} from '@tanstack/react-query';
import {Loader2} from 'lucide-react';
import {base44} from '@/api/base44Client';
import {Image} from '@/components/ui/image';

export default function ProfilePicture({user,className='h-10 w-10'}) {
  const uri=user?.profile_picture_uri;
  const photo=useQuery({queryKey:['profile-picture',user?.id,uri],enabled:!!uri,queryFn:async()=>{
    const result=await base44.integrations.Core.CreateFileSignedUrl({file_uri:uri,expires_in:900});
    return result.signed_url;
  },staleTime:600000,refetchInterval:600000,retry:false});
  const initials=(user?.full_name || user?.email || 'User').trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase();
  return <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-semibold text-foreground ${className}`}>
    {photo.isFetching && !photo.data ? <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading profile picture"/> : photo.data ? <Image src={photo.data} alt={`${user?.full_name || 'Your'} profile picture`} className="h-full w-full object-cover"/> : initials}
  </span>;
}