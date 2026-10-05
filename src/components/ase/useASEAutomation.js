import {useEffect,useState} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {aseRequest,invalidateASE} from '@/components/ase/aseClient';
export default function useASEAutomation(accountId) {
  const cache=useQueryClient(),[runId,setRunId]=useState(null),[cursor,setCursor]=useState(null),[outcome,setOutcome]=useState('');
  const scope=useQuery({queryKey:['ase-automation-scope',accountId],queryFn:()=>aseRequest('automationScope',{accountId})});
  const status=useQuery({queryKey:['ase-automation',accountId,runId,cursor,outcome],queryFn:()=>aseRequest('automationStatus',{accountId,runId,cursor,outcome}),refetchInterval:query=>['queued','running'].includes(query.state.data?.run?.status) ? 10000 : false});
  const action=useMutation({mutationFn:({action,...input})=>aseRequest(action,{accountId,runId:status.data?.run?.id,confirmed:true,...input}),onSuccess:result=>{if(result.run){setRunId(result.run.id);setCursor(null);setOutcome('');}cache.invalidateQueries({queryKey:['ase-automation']});}});
  const run=status.data?.run;
  useEffect(()=>{if(run?.status==='completed'){invalidateASE(cache);cache.invalidateQueries({queryKey:['companies-house']});}},[run?.id,run?.status,cache]);
  return {scope,status,action,cursor,setCursor,outcome,filter:value=>{setOutcome(value);setCursor(null);}};
}