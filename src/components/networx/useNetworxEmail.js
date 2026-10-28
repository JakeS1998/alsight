import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import networxEmailClient from '@/components/networx/networxEmailClient';
import prepareNetworxAttachment from '@/components/networx/prepareNetworxAttachment';
export default function useNetworxEmail({entity,recordId,onBusyChange,replyToId}) {
  const {user} = useAuth(), cache = useQueryClient();
  const queryKey = ['networx-email',user?.id,entity,recordId,replyToId || 'new'];
  const query = useQuery({queryKey,queryFn:()=>networxEmailClient({action:replyToId ? 'prepare_reply' : 'prepare',entity,recordId,...(replyToId ? {replyToId} : {})}),retry:false,staleTime:0,gcTime:0,refetchOnWindowFocus:false});
  const [emailId] = useState(()=>crypto.randomUUID());
  const [attachments,setAttachments]=useState([]);
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
  async function addAttachments(files) {
    if(busy || !files.length)return;
    const combined=[...attachments,...files];
    if(combined.length>5 || files.some(file=>!file.size || file.size>5*1024*1024) || combined.reduce((sum,file)=>sum+file.size,0)>10*1024*1024){setError('Attach up to 5 files, 5 MB each and 10 MB total.');return;}
    if(files.some(file=>!(/\.(pdf|docx|xlsx|pptx|png|jpe?g|gif|webp|txt|csv)$/i.test(file.name)) || file.name.length>200)){setError('Choose PDF, Office documents, images, text or CSV files with names up to 200 characters.');return;}
    setError('');setWorking('attachments');
    try {for(const file of files){const prepared=await prepareNetworxAttachment(file);setAttachments(previous=>[...previous,prepared]);}}
    catch(failure){setError(failure.message || 'Unable to prepare attachments.');}
    finally {setWorking('');}
  }
  async function send(event) {
    event.preventDefault();if (busy || result) return;
    const form = new FormData(event.currentTarget), [kind,id] = String(form.get('recipient') || '').split(':');
    setError('');setWorking('send');
    try {
      const data = await networxEmailClient({action:'send',entity,recordId,emailId,...(replyToId ? {replyToId,replyRecipientKey:form.get('replyRecipient')} : {recipient:{entity:kind,id}}),subject:form.get('subject'),body:form.get('body'),attachments:attachments.map(({id,filename,body})=>({id,filename,body}))});
      if (!data.accepted) throw new Error(data.message || 'The email has not been accepted for sending.');
      setResult(data);
      await Promise.all([cache.invalidateQueries({queryKey:['networx-activities',user?.id]}),cache.invalidateQueries({queryKey:['networx-email-thread',user?.id]})]);
    } catch (failure) {setError(`${failure.message} If an email appeared in the timeline, review its status before retrying. Retrying this unchanged form reuses the same email reference.`);}
    finally {setWorking('');}
  }
  return {query,busy,error,result,enableTracking,send,attachments,addAttachments,removeAttachment:id=>setAttachments(previous=>previous.filter(file=>file.id!==id))};
}