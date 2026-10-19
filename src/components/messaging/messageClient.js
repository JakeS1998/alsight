import {base44} from '@/api/base44Client';
export const internalMessagingRoles=['admin','director','regional_director','bsm','finance','bdm','sam','sam_director'];
export async function messageCall(input){const {data}=await base44.functions.invoke('manageDirectMessages',input);if(data.error)throw new Error(data.error);return data;}