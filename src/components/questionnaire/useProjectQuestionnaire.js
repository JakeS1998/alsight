import {useEffect,useState} from 'react';
import {base44} from '@/api/base44Client';
import pqContext from '@/components/questionnaire/pqContext';
export default function useProjectQuestionnaire(projectId,subject) {
 const source=pqContext(projectId,subject),sourceKey=JSON.stringify(source);
 const [data,setData]=useState(null),[answers,setAnswers]=useState({}),[busy,setBusy]=useState(false),[error,setError]=useState(''),[loading,setLoading]=useState(true),[dirty,setDirty]=useState(false),[missing,setMissing]=useState([]);
 const load=async(retryImport=false)=>{setLoading(true);setError('');try{const {data:result}=await base44.functions.invoke('manageProjectQuestionnaire',{action:'load',...source,retryImport:retryImport===true});if(result.error)throw new Error(result.error);setData(result);setAnswers(result.record?.answers||result.defaults);setDirty(false);setMissing([]);}catch(e){setError(e.response?.data?.error||e.message);}finally{setLoading(false);}};
 useEffect(()=>{load();},[sourceKey]);
 useEffect(()=>{const warn=event=>{if(dirty){event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
 const change=(id,value)=>{setAnswers(current=>({...current,[id]:value}));setDirty(true);setMissing(current=>current.filter(key=>key!==id));setError('');};
 const save=async action=>{setBusy(true);setError('');setMissing([]);try{const {data:result}=await base44.functions.invoke('manageProjectQuestionnaire',{action,...source,answers,revision:data.record?.revision||0});if(result.error)throw new Error(result.error);setData(current=>({...current,record:result.record}));setAnswers(result.record.answers);setDirty(false);return true;}catch(e){setError(e.response?.data?.error||e.message);setMissing(e.response?.data?.missing||[]);return false;}finally{setBusy(false);}};
 return {data,answers,busy,error,loading,dirty,missing,load,change,save,setMissing,setError};
}