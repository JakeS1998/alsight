import { base44 } from '@/api/base44Client';
export default async function flowRequest(action, input = {}) {
  try {
    const { data } = await base44.functions.invoke('manageDataverseFlow', { action, ...input });
    if (data.error) { const error = new Error(data.error); error.code = data.code; throw error; }
    return data;
  } catch (error) {
    error.message = error.response?.data?.error || error.message;
    error.code = error.response?.data?.code || error.code;
    throw error;
  }
}