import { base44 } from '@/api/base44Client';
export default async function dataverseUserRequest(action, values = {}) {
  try {
    const { data } = await base44.functions.invoke('manageDataverseUser', { action, ...values });
    if (data.error) throw new Error(data.error);
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.error || error.message || 'Unable to access Dataverse.');
  }
}