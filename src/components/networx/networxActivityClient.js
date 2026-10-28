import {base44} from '@/api/base44Client';
export default async function networxActivityClient(input) {
 try {const {data}=await base44.functions.invoke('manageNetworxActivity',input);if(data.error)throw new Error(data.error);return data;}
 catch(error){throw new Error(error.response?.data?.error || error.message || 'Unable to save this activity.');}
}