import React,{useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import approvalClient from '@/components/approvals/approvalClient';
export default function ApprovalAccessControl({contact}) {
 const cache=useQueryClient(),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const key=['person-approval-access',contact.id,contact.email];
 const query=useQuery({queryKey:key,queryFn:()=>approvalClient('contactAccess',{contactId:contact.id}),retry:false});
 async function save(enabled) {
  setBusy(true);setError('');setNotice('');
  try {
   const result=await approvalClient('setContactAccess',{contactId:contact.id,enabled});
   cache.setQueryData(key,result);
   await cache.invalidateQueries({queryKey:['approval-access']});
   setNotice(enabled ? 'Approval access granted.' : 'Approval access revoked.');
  } catch(failure) {setError(failure?.response?.data?.error || failure.message || 'Approval access could not be saved.');}
  finally {setBusy(false);}
 }
 return <div className="mt-5 rounded-lg border border-border p-4">
  <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={query.data?.enabled===true} onChange={event=>save(event.target.checked)} disabled={query.isPending || !!query.error || !query.data?.email || busy} className="h-4 w-4 accent-primary"/>Approval access</label>
  <p className="mt-2 text-xs text-muted-foreground">Show the approval centre for this portal email and allow access to its assigned approval inbox. This does not change their portal role or project access.</p>
  {query.isPending && <p className="mt-2 text-xs text-muted-foreground" role="status">Loading approval access…</p>}
  {busy && <p className="mt-2 text-xs text-muted-foreground" role="status">Saving approval access…</p>}
  {query.data?.notice && <p className="mt-2 text-xs text-muted-foreground">{query.data.notice}</p>}
  {(error || query.error) && <p className="mt-2 text-xs text-destructive" role="alert">{error || query.error?.response?.data?.error || query.error.message}</p>}
  {notice && <p className="mt-2 text-xs text-success" role="status">{notice}</p>}
 </div>;
}