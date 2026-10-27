import React,{useEffect,useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
import {Button} from '@/components/ui/button';
import approvalClient from '@/components/approvals/approvalClient';
import PortalPageAccessFields from '@/components/relationships/PortalPageAccessFields';
export default function PersonPageAccess({contact,user}) {
 const cache=useQueryClient(),{user:administrator,checkUserAuth}=useAuth();
 const [value,setValue]=useState(user?.page_access||{}),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{setValue(user?.page_access||{});},[user?.id,user?.role,user?.page_access]);
 const approval=useQuery({queryKey:['person-approval-access',contact.id,contact.email],queryFn:()=>approvalClient('contactAccess',{contactId:contact.id}),enabled:!!user?.id,retry:false});
 const dirty=JSON.stringify(value)!==JSON.stringify(user?.page_access||{});
 async function save(){
  setBusy(true);setError('');setNotice('');
  try{
   const {data}=await base44.functions.invoke('getPersonPortalAccess',{action:'savePageAccess',contactId:contact.id,pageAccess:value});
   if(data.error)throw new Error(data.error);
   cache.setQueryData(['person-portal-account',contact.id,administrator?.id,administrator?.role],data);
   if(user.id===administrator?.id)await checkUserAuth();
   setNotice('Page access saved. Changes apply when this user next refreshes or signs in.');
  }catch(failure){setError(failure.response?.data?.error||failure.message||'Page access could not be saved.');}
  finally{setBusy(false);}
 }
 return <section className="mt-5 space-y-4 rounded-panel border border-border p-4" aria-labelledby="portal-page-access-title">
  <div><h3 id="portal-page-access-title" className="text-sm font-semibold">Page access</h3><p className="mt-1 text-xs text-muted-foreground">These checkboxes mirror the top menu. Defaults follow the access role; admins can show additional pages or hide pages, including direct page links. Existing data and action permissions remain unchanged.</p></div>
  {!user?<p className="text-sm text-muted-foreground">Page access can be customised once this person has a linked portal account.</p>:<>
   <PortalPageAccessFields user={user} value={value} onChange={next=>{setValue(next);setNotice('');}} approvalEnabled={approval.data?.enabled===true} disabled={busy||approval.isPending||!!approval.error}/>
   {approval.isPending&&<p className="text-xs text-muted-foreground" role="status">Checking approval page defaults…</p>}
   {approval.error&&<p role="alert" className="text-xs text-destructive">Unable to check approval page defaults. <button type="button" className="underline" onClick={()=>approval.refetch()}>Try again</button></p>}
   <div className="flex flex-wrap gap-2"><Button type="button" disabled={!dirty||busy||approval.isPending||!!approval.error} onClick={save}>{busy?'Saving…':'Save page access'}</Button><Button type="button" variant="outline" disabled={busy||!Object.keys(value).length} onClick={()=>{setValue({});setNotice('Role defaults restored. Save page access to apply.');}}>Reset to role defaults</Button></div>
  </>}
  {error&&<p className="text-xs text-destructive" role="alert">{error}</p>}{notice&&<p className="text-xs text-success" role="status">{notice}</p>}
 </section>;
}