import React,{useRef,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import {ieCall} from '@/components/ie/ieClient';
import {Image} from '@/components/ui/image';
import {Loader2,RefreshCw} from 'lucide-react';
const illustration='https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1600&q=85';
export default function IEEngagementPhoto({item}){
 const {user}=useAuth(),refresh=useRef(false),[failed,setFailed]=useState('');
 const photo=useQuery({queryKey:['ie-header-image',item.id,item.project_id,item.sites,item.client_name,user.id,user.role],staleTime:24*60*60*1000,retry:false,queryFn:()=>{const retrySearch=refresh.current;refresh.current=false;return ieCall('headerImage',{id:item.id,retrySearch});}});
 const actual=photo.data?.url&&photo.data.url!==failed,url=actual?photo.data.url:illustration;
 return <>
  <div className="ws-heroimg"><Image src={url} alt={actual?photo.data.caption||`${item.sites?.[0]||item.name} engagement location`:'Illustrative stakeholder engagement workshop'} className="h-full w-full object-cover" loading="eager" onError={()=>setFailed(url)}/></div>
  <div className="ie-hero-image-note" role="status">
   {photo.isFetching?<><Loader2 className="h-3 w-3 animate-spin"/>Finding engagement image…</>:!actual?'Illustrative engagement image':null}
   {!photo.isFetching&&(photo.isError||failed===photo.data?.url)&&<button type="button" className="inline-flex items-center gap-1 underline" onClick={()=>{setFailed('');refresh.current=true;photo.refetch();}}><RefreshCw className="h-3 w-3"/>Retry image</button>}
  </div>
 </>;
}