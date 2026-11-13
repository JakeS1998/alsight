import React from 'react';
import {useQuery} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import {base44} from '@/api/base44Client';
import DMAFeeEvidence from '@/components/ase/DMAFeeEvidence';
export default function VigoDMAFeePanel({projectId}) {
 const {user}=useAuth();
 const eligible=['6ac7b8e21d5610a3a3c8f502','931b23c0-d1b0-f011-bbd2-6045bd142db3'].includes(projectId)&&['admin','bsm','bdm','director','regional_director','finance'].includes(user?.role);
 const query=useQuery({queryKey:['vigo-dma-fees',user?.id,user?.role],enabled:eligible,staleTime:60000,retry:false,queryFn:async()=>{const {data}=await base44.functions.invoke('manageASE',{action:'dmaFees',projectId:'6ac7b8e21d5610a3a3c8f502'});if(data.error)throw new Error(data.error);return data;}});
 if(!eligible)return null;
 if(query.isPending)return <p role="status" className="text-xs text-muted-foreground">Reading signed DMA Schedule 5 fee evidence…</p>;
 if(query.error)return <p role="alert" className="text-xs text-destructive">{query.error.message} <button className="underline" onClick={()=>query.refetch()}>Try again</button></p>;
 return <DMAFeeEvidence data={query.data}/>;
}