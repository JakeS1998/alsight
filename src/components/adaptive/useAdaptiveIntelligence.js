import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
export default function useAdaptiveIntelligence(records,time) {
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[reply,setReply]=useState(null),[insights,setInsights]=useState(null),[lastCall,setLastCall]=useState(0);
 const contextKey=JSON.stringify([records,time.phase,time.day]),currentContext=useRef(contextKey);currentContext.current=contextKey;
 useEffect(()=>{setInsights(null);setReply(null);setError('');},[contextKey]);
 async function request(mode,question,sectionRecords,sectionLabel) {
  if(busy)return;
  if(Date.now()-lastCall<10000){setError('Please wait a few seconds between intelligence requests.');return;}
  setBusy(true);setError('');setLastCall(Date.now());
  const visible=(sectionRecords||records).slice(0,20),scope=sectionLabel||'Your working day';
  const temporal=`${time.day}; ${time.phase}; saved hours ${time.workdayStart}–${time.workdayEnd}; ${time.withinPersonal?'within':'outside'} saved hours, not evidence of working. ${!time.workingDay?'Non-working day; non-urgent work can wait.':time.resting?'Rest context; no non-urgent starts.':'Suggestions only.'} Facts and suggestions must be distinct; cite sources. No urgency inferred, actions taken or email access.`;
  try{const {data}=await base44.functions.invoke('adaptiveTodayIntelligence',{mode,question:`${question.slice(0,240)} Context: ${temporal} Section: ${scope}`.slice(0,600),records:visible.map(({title,detail,due,level})=>({title,detail,due,level}))});if(currentContext.current!==contextKey)return;if(data.error)throw Error(data.error);const value={...data,suggestions:data.suggestions.map(s=>({...s,to:visible[s.recordIndex]?.to,source:visible[s.recordIndex]?.title}))};if(mode==='recommend')setInsights(value);else setReply({...value,question,contextLabel:scope});}
  catch(e){setError(e.response?.data?.error||e.message||'Intelligence unavailable.');}finally{setBusy(false);}
 }
 return {busy,error,reply,insights,request};
}