import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
export default function useAdaptiveIntelligence(records,time) {
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[reply,setReply]=useState(null),[insights,setInsights]=useState(null),[lastCall,setLastCall]=useState(0);
 const contextKey=JSON.stringify([records,time.phase,time.day]),currentContext=useRef(contextKey);currentContext.current=contextKey;
 useEffect(()=>{setInsights(null);setReply(null);setError('');},[contextKey]);
 async function request(mode,question) {
  if(busy)return;
  if(Date.now()-lastCall<10000){setError('Please wait a few seconds between intelligence requests.');return;}
  setBusy(true);setError('');setLastCall(Date.now());
  const temporal=`Local ${time.day}; ${time.phase}; standard 09:00–17:00; flexible 07:30–18:30. ${!time.workingDay?'Weekend: non-urgent work can wait until Monday. Support rest, but help when asked.':time.resting?'Support rest; avoid proactive non-urgent starts but help when asked.':'Flexible hours are normal; wrap-up is preparation, not an instruction to finish.'} Never infer urgency or completed work. No email data. No automatic actions.`;
  try{const {data}=await base44.functions.invoke('adaptiveTodayIntelligence',{mode,question:`${question.slice(0,300)} Context: ${temporal}`.slice(0,600),records:records.map(({title,detail,due,level})=>({title,detail,due,level}))});if(currentContext.current!==contextKey)return;if(data.error)throw Error(data.error);const value={...data,suggestions:data.suggestions.map(s=>({...s,to:records[s.recordIndex]?.to,source:records[s.recordIndex]?.title}))};if(mode==='recommend')setInsights(value);else setReply({...value,question});}
  catch(e){setError(e.response?.data?.error||e.message||'Intelligence unavailable.');}finally{setBusy(false);}
 }
 return {busy,error,reply,insights,request};
}