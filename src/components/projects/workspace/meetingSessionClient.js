import {base44} from '@/api/base44Client';
export async function meetingSessionRequest(action,sessionId,details={}) {
 try {
  const {data}=await base44.functions.invoke('manageMeetingSession',{action,sessionId,...details});
  if(data?.error)throw new Error(data.error);
  return data;
 } catch(error) {throw new Error(error.response?.data?.error || error.message);}
}