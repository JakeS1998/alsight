import React,{useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
export default function BrokenLinkRecheck({item,source,onSaved}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),cache=useQueryClient();
 async function read(){setBusy(true);setError('');setNotice('');try{
  const payload=source==='jct'?{action:'extractJCT',contractId:item.recordId}:source==='dma'?{action:'extractSigned',dmaId:item.recordId}:{action:'appointmentFee',appointmentId:item.recordId};
  const {data}=await base44.functions.invoke('manageDMAConcentration',payload);if(data.error)throw new Error(data.error);
  setNotice(data.note||'Document read completed.');await onSaved();cache.invalidateQueries({queryKey:['ase']});
 }catch(error){setError(error.response?.data?.error||error.message);}finally{setBusy(false);}}
 if(!item.recordId||!item.url)return null;
 return <div className="max-w-sm whitespace-normal space-y-2"><Button size="sm" variant="outline" disabled={busy} onClick={read}>{busy?'Reading PDF…':'Read PDF / values'}</Button>{notice&&<p role="status" className="text-xs text-muted-foreground">{notice}</p>}{error&&<p role="alert" className="text-xs text-destructive">{error}</p>}</div>;
}