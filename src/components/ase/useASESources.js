import { useQuery,useMutation,useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { invalidateASE } from '@/components/ase/aseClient';
export async function aseSourceRequest(action,input) { const response=await base44.functions.invoke('manageASESources',{action,...input}); if(response.data?.error) throw new Error(response.data.error); return response.data; }
export default function useASESources(accountId,user) {
  const cache=useQueryClient();
  const query=useQuery({queryKey:['ase','sources',accountId,user?.id,user?.role],queryFn:()=>aseSourceRequest('status',{accountId})});
  const refresh=useMutation({mutationFn:input=>aseSourceRequest('refresh',{accountId,...input}),onSuccess:()=>invalidateASE(cache)});
  return {query,refresh};
}