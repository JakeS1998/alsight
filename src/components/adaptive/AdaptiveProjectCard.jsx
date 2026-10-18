import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Building2, Loader2, ImageOff } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useAuth } from '@/lib/AuthContext';
import useProjectHeroPhoto from '@/components/projects/useProjectHeroPhoto';

export default function AdaptiveProjectCard({row}) {
 const {user}=useAuth();
 const photo=useProjectHeroPhoto(row.project,user);
 const [failedUrl,setFailedUrl]=useState(null);
 const url=photo.data?.url,loading=photo.isPending||photo.isFetching;
 return <Link className="at-project-card" to={row.to}>
  <div className="at-project-picture bg-muted">
   {url&&url!==failedUrl?<Image src={url} alt={photo.data.caption||`${row.title} project photograph`} className="h-full w-full" onError={()=>setFailedUrl(url)}/>:<div className="flex h-full items-center justify-center gap-2 px-3 text-xs text-muted-foreground" role="status">{loading?<><Loader2 size={16} className="shrink-0 animate-spin"/><span>Finding project image…</span></>:<><ImageOff size={16} className="shrink-0"/><span>No project image available</span></>}</div>}
   <span className="at-project-active">Active</span>
  </div>
  <div className="at-project-copy"><h4>{row.title}</h4><p>{row.detail||'Live project workspace'}</p><span><Building2 size={12}/> Open project <ArrowUpRight size={13}/></span></div>
 </Link>;
}