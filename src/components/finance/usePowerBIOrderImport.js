import {useState,useEffect} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import powerBIOrdersClient from '@/components/finance/powerBIOrdersClient';
export default function usePowerBIOrderImport(){
 const client=useQueryClient(),[draft,setDraft]=useState(null),[columns,setColumns]=useState([]),[busy,setBusy]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const q=useQuery({queryKey:['powerbi-order-import'],queryFn:()=>powerBIOrdersClient({action:'status'}),refetchInterval:query=>query.state.data?.state?.status==='running'?5000:false}),state=q.data?.state;
 const form=draft||{reportURL:state?.report_url||'',sources:state?.sources||{PO:{},SO:{}}};
 async function discover(){setBusy('discover');setError('');try{const {data}=await base44.functions.invoke('managePowerBIConnection',{action:'discover',reportURL:form.reportURL});if(data.error)throw new Error(data.error);setColumns(data.columns.filter(c=>!c.Hidden));}catch(e){setError(e.message);}finally{setBusy('');}}
 async function run(action,extra={}){setBusy(action);setError('');setNotice('');try{let d=await powerBIOrdersClient({action:action==='continue'?'status':action,...(action==='configure'?form:{}),...extra});if(action==='configure')setDraft(null);if(action==='start'||action==='continue'){let s=d.state;while(s?.status==='running'){d=await powerBIOrdersClient({action:'batch',generation:s.generation});s=d.state;client.setQueryData(['powerbi-order-import'],{state:s});if(d.busy)break;}}setNotice(d.notice||'Import progress saved. Completed data is available for review.');await q.refetch();client.invalidateQueries({queryKey:['finance-status']});client.invalidateQueries({queryKey:['finance']});}catch(e){setError(e.message);q.refetch();}finally{setBusy('');}}
 useEffect(()=>{if(state?.report_url&&!columns.length){base44.functions.invoke('managePowerBIConnection',{action:'discover',reportURL:state.report_url}).then(({data})=>{if(data.error)setError(data.error);else setColumns(data.columns.filter(c=>!c.Hidden));},e=>setError(e.message));}},[state?.report_url]);
 return {q,state,form,columns,busy,error,notice,setDraft,discover,run};
}