import {useEffect,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {base44} from '@/api/base44Client';
import requestFormValues,{restoreRequestForm} from '@/components/projects/requestFormValues';
export default function useRequestPQ({form,setForm,setMode,requestId,empty,open,resumeId}) {
 const [draft,setDraft]=useState(null),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),navigate=useNavigate();
 const resume=async id=>{setBusy(true);setError('');try{const {data}=await base44.functions.invoke('manageProjectQuestionnaire',{action:'load_request',requestDraftId:id});if(data.draft.project_id){navigate(`/projects/${data.draft.project_id}`);return;}setDraft(data.draft);requestId.current=data.draft.request_key;setForm(restoreRequestForm(empty,data.draft));setReady(false);setMode('manual');}catch(e){setError(e.response?.data?.error||e.message);}finally{setBusy(false);}};
 useEffect(()=>{if(open&&resumeId)resume(resumeId);},[open,resumeId]);
 const prepare=async()=>{setBusy(true);setError('');setReady(false);try{const {data}=await base44.functions.invoke('manageProjectQuestionnaire',{action:'prepare_request',requestKey:requestId.current,...(draft?{requestDraftId:draft.id}:{}),values:requestFormValues(form)});setDraft(data.draft);setMode('pq');}catch(e){setError(e.response?.data?.error||e.message);if(draft)setMode('pq');}finally{setBusy(false);}};
 const reset=()=>{setDraft(null);setReady(false);setError('');};
 return {draft,ready,setReady,busy,error,resume,prepare,reset};
}