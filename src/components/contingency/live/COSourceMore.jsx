import React,{useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {coCall} from '@/components/contingency/live/useContingencyOperations';
export default function COSourceMore({data}){
 const client=useQueryClient(),[busy,setBusy]=useState(false),[error,setError]=useState('');
 if(!data.dataset_has_more)return null;
 async function load(){setBusy(true);setError('');try{
  const page=await coCall('status',{source_cursor:data.dataset_next_cursor});
  client.setQueryData(['co-status'],old=>({...old,datasets:[...old.datasets,...page.datasets.filter(d=>!old.datasets.some(x=>x.id===d.id))],dataset_has_more:page.dataset_has_more,dataset_next_cursor:page.dataset_next_cursor}));
 }catch(e){setError(e.message);}finally{setBusy(false);}}
 return <div className="mt-4"><Button variant="outline" disabled={busy} onClick={load}>{busy?'Loading sources…':'Load more sources'}</Button>{error&&<p className="mt-2 text-sm text-destructive" role="alert">{error}</p>}</div>;
}