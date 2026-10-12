import {base44} from '@/api/base44Client';
export default async function projectApprovalClient(action,values={}) {
 const response=await base44.functions.invoke('manageProjectApprovals',{action,...values});
 if(response.data?.error && !Object.hasOwn(response.data,'ok'))throw new Error(response.data.error);
 return response.data;
}