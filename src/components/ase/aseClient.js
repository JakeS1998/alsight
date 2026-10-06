import { base44 } from '@/api/base44Client';
import allSeeingEyeText, {allSeeingEyeCopy} from '@/components/ase/allSeeingEyeText';
export const aseRoles = ['admin','director','regional_director','bsm','bdm','finance'];
export const aseLabels = ['Not assessed','Serious Concern','Weak','Stable / Monitor','Good','Strong'];
export async function aseRequest(action,input={}) {
  const {data}=await base44.functions.invoke('manageASE',{action,...input});
  if(data?.error) throw new Error(allSeeingEyeText(data.error));
  return allSeeingEyeCopy(data);
}
export function invalidateASE(cache) {
  cache.invalidateQueries({queryKey:['ase']});
  cache.invalidateQueries({queryKey:['account-group']});
  cache.setQueryData(['accounts-revision'],Date.now());
  cache.invalidateQueries({queryKey:['accounts-view']});
}
export const aseError = error => allSeeingEyeText(error?.response?.data?.error || error?.message || 'All Seeing Eye operation failed.');