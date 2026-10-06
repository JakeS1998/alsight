import {base44} from '@/api/base44Client';
import allSeeingEyeText, {allSeeingEyeCopy} from '@/components/ase/allSeeingEyeText';
export async function aseV2Request(action,input={}) {const response=await base44.functions.invoke('manageASEV2',{action,...input});if(response.data?.error) throw new Error(allSeeingEyeText(response.data.error));return allSeeingEyeCopy(response.data);}