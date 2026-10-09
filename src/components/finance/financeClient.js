import { base44 } from '@/api/base44Client';
export async function financeCall(payload){
 try{const {data}=await base44.functions.invoke('manageFinanceDashboard',payload);if(data.error)throw new Error(data.error);return data;}
 catch(error){throw new Error(error.response?.data?.error||error.message||'Finance data could not be loaded.');}
}