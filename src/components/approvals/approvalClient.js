import {base44} from '@/api/base44Client';
export default async function approvalClient(action, values = {}) {
  try {
    const {data} = await base44.functions.invoke('manageApprovalCentre', {action, ...values});
    if (data.error) throw new Error(data.error);
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.error || error.response?.data?.message || error.message || 'Unable to load approvals.');
  }
}