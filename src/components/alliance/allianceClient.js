import {base44} from '@/api/base44Client';
export default async function allianceRequest(action,input={}) {
  const result=await base44.functions.invoke('manageAllianceLayer',{action,...input});
  if(result.data?.error) throw new Error(result.data.error);
  return result.data;
}
export const allianceError=error=>error?.response?.data?.error || error?.message || 'Unable to load Alliance content.';
export const refreshAlliance=cache=>cache.invalidateQueries({queryKey:['alliance-layer']});