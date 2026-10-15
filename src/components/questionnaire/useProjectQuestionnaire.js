import {useEffect,useState} from 'react';
import {base44} from '@/api/base44Client';
export default function useProjectQuestionnaire(projectId) {
 const [data,setData]=useState(null),[answers,setAnswers]=useState({}),[busy,setBusy]=useState(false),[error,setError]=useState(''),[loading,setLoading]=useState(true),[dirty,setDirty]=useState(false),[missing,setMissing]=useState([]);
 const load=async()=>{setLoading(true);setError('');try{const {data:result}=await base44.functions.invoke('manageProjectQuestionnaire',{action:'load',projectId});if(result.error)throw new Error(result.error);setData(result);setAnswers(result.record?.answers||result.defaults);setDirty(false);setMissing([]);}catch(e){setError(e.response?.data?.error||e.message);}finally{setLoading(false);}};
 useEffect(()=>{load();},[projectId]);
 useEffect(()=>{const warn=event=>{if(dirty){event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
 const change=(id,value)=>{setAnswers(current=>({...current,[id]:value}));setDirty(true);setMissing(current=>current.filter(key=>key!==id));setError('');};
 const save=async action=>{setBusy(true);setError('');setMissing([]);try{const {data:result}=await base44.functions.invoke('manageProjectQuestionnaire',{action,projectId,answers,revision:data.record?.revision||0});if(result.error)throw new Error(result.error);setData(current=>({...current,record:result.record}));setAnswers(result.record.answers);setDirty(false);return true;}catch(e){setError(e.response?.data?.error||e.message);setMissing(e.response?.data?.missing||[]);return false;}finally{setBusy(false);}};
 return {data,answers,busy,error,loading,dirty,missing,load,change,save,setMissing,setError};
}