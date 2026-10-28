import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import networxEmailClient from '@/components/networx/networxEmailClient';
export default function useNetworxEmail({entity,recordId,onBusyChange}) {
  const {user} = useAuth(), cache = useQueryClient();
  const queryKey = ['networx-email',user?.id,entity,recordId];
  const query = useQuery({queryKey,queryFn:()=>networxEmailClient({action:'prepare',entity,recordId}),retry:false,staleTime:0,gcTime:0,refetchOnWindowFocus:false});
  const [emailId] = useState(()=>crypto.randomUUID());
  const [busy,setBusy] = useState(''), [error,setError] = useState(''), [result,setResult] = useState(null);
  const setWorking = value=>{setBusy(value);onBusyChange(Boolean(value));};
  async function enableTracking() {
    setError('');setWorking('tracking');
    try {
      const data = await networxEmailClient({action:'enable_tracking',entity,recordId});
      if (data.state!=='ready') throw new Error(data.message);
      cache.setQueryData(queryKey,previous=>({...previous,mailbox:data.mailbox}));
    } catch (failure) {setError(failure.message);}
    finally {setWorking('');}
  }
  async function send(event) {
    event.preventDefault();if (busy || result) return;
    const form = new FormData(event.currentTarget), [kind,id] = String(form.get('recipient') || '').split(':');
    setError('');setWorking('send');
    try {
      const data = await networxEmailClient({action:'send',entity,recordId,emailId,recipient:{entity:kind,id},subject:form.get('subject'),body:form.get('body')});
      if (!data.accepted) throw new Error(data.message || 'The email has not been accepted for sending.');
      setResult(data);
      await cache.invalidateQueries({queryKey:['networx-activities',user?.id]});
    } catch (failure) {setError(`${failure.message} If an email appeared in the timeline, review its status before retrying. Retrying this unchanged form reuses the same email reference.`);}
    finally {setWorking('');}
  }
  return {query,busy,error,result,enableTracking,send};
}