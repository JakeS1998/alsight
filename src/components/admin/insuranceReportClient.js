import {base44} from '@/api/base44Client';
export async function insuranceReportRequest(values) {
 try {
  const {data}=await base44.functions.invoke('manageInsuranceReports',values);
  if(data.error)throw new Error(data.error);
  return data;
 } catch(error) {
  const message=error?.response?.data?.error;
  if(message)throw Object.assign(new Error(message),{status:error.response.status});
  throw error;
 }
}