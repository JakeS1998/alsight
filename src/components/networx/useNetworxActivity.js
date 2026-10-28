import {useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import networxActivityClient from '@/components/networx/networxActivityClient';
export default function useNetworxActivity({entity,recordId,kind,onBusyChange}) {
 const {user}=useAuth(),cache=useQueryClient();
 const [activityId]=useState(()=>crypto.randomUUID()),[people,setPeople]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[result,setResult]=useState(null);
 const query=useQuery({queryKey:['networx-activity-prepare',user?.id,entity,recordId],queryFn:()=>networxActivityClient({action:'prepare',entity,recordId}),retry:false,gcTime:0,refetchOnWindowFocus:false});
 async function submit(event) {
  event.preventDefault();if(busy || result)return;
  const form=new FormData(event.currentTarget),start=new Date(String(form.get('start'))),end=new Date(String(form.get('end')));
  if(!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end<=start){setError('Choose valid start and end times.');return;}
  if(kind!=='call' && !people.length){setError('Add at least one attendee.');return;}
  setBusy(true);onBusyChange(true);setError('');
  try {
   const data=await networxActivityClient({action:'save',entity,recordId,kind,activityId,subject:String(form.get('subject') || ''),notes:String(form.get('notes') || ''),location:String(form.get('location') || ''),start:start.toISOString(),end:end.toISOString(),direction:String(form.get('direction') || 'outgoing'),phone:String(form.get('phone') || ''),people:people.map(({entity,id})=>({entity,id}))});
   if(!data.saved)throw new Error(data.message || 'The activity was not confirmed.');
   setResult(data);await cache.invalidateQueries({queryKey:['networx-activities',user?.id]});
  }catch(failure){setError(`${failure.message} Keep this form open and retry unchanged to reuse the same reference${kind==='call' ? '.' : '; Outlook may already have sent invitations. Do not create another meeting for the same request.'}`);}
  finally{setBusy(false);onBusyChange(false);}
 }
 return {query,people,setPeople,busy,error,result,submit};
}