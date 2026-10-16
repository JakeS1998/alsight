import { useState } from 'react';
import { base44 } from '@/api/base44Client';
export default function useAdaptiveIntelligence(records) {
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[reply,setReply]=useState(null),[insights,setInsights]=useState(null),[lastCall,setLastCall]=useState(0);
 async function request(mode,question) {
  if(busy)return;
  if(Date.now()-lastCall<10000){setError('Please wait a few seconds between intelligence requests.');return;}
  setBusy(true);setError('');setLastCall(Date.now());
  try{const {data}=await base44.functions.invoke('adaptiveTodayIntelligence',{mode,question:question.slice(0,600),records:records.map(({title,detail,due,level})=>({title,detail,due,level}))});if(data.error)throw Error(data.error);const value={...data,suggestions:data.suggestions.map(s=>({...s,to:records[s.recordIndex]?.to,source:records[s.recordIndex]?.title}))};if(mode==='recommend')setInsights(value);else setReply({...value,question});}
  catch(e){setError(e.response?.data?.error||e.message||'Intelligence unavailable.');}finally{setBusy(false);}
 }
 return {busy,error,reply,insights,request};
}