import {base44} from '@/api/base44Client';
export default async function approvalClient(action, values = {}) {
  const {data} = await base44.functions.invoke('manageApprovalCentre', {action, ...values});
  if (data.error) throw new Error(data.error);
  return data;
}