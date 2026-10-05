import { base44 } from '@/api/base44Client';
export const aseRoles = ['admin','director','regional_director','bsm','bdm','finance'];
export const aseLabels = ['Not assessed','Serious Concern','Weak','Stable / Monitor','Good','Strong'];
export async function aseRequest(action,input={}) {
  const {data}=await base44.functions.invoke('manageASE',{action,...input});
  if(data?.error) throw new Error(data.error);
  return data;
}
export function invalidateASE(cache) {
  cache.invalidateQueries({queryKey:['ase']});
  cache.invalidateQueries({queryKey:['account-group']});
  cache.setQueryData(['accounts-revision'],Date.now());
  cache.invalidateQueries({queryKey:['accounts-view']});
}
export const aseError = error => error?.response?.data?.error || error?.message || 'ASE operation failed.';