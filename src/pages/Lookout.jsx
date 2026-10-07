import React,{useState} from 'react';
import {Link,Navigate,useParams} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import {INTERNAL_ROLES} from '@/lib/portal';
import LookoutPublication from '@/components/lookout/LookoutPublication';
import lookoutRequest,{downloadLookout} from '@/components/lookout/lookoutClient';
export default function Lookout() {
  const {issueId}=useParams(),{user}=useAuth(),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const enabled=!!user && INTERNAL_ROLES.includes(user.role);
  const query=useQuery({queryKey:['lookout','issue',issueId,user?.id],enabled,queryFn:()=>lookoutRequest('get',{id:issueId}),staleTime:30000});
  if(user && !enabled) return <Navigate to="/" replace/>;
  const pdf=async()=>{setBusy(true);setError('');try{await downloadLookout(query.data.issue);}catch(e){setError(e.message);}finally{setBusy(false);}};
  return <div className="lookout-theme mx-auto max-w-6xl space-y-4"><div className="flex items-center justify-between gap-3"><Link to="/pulse" className="text-sm underline">Back to Insider</Link>{query.data && <button disabled={busy} onClick={pdf} className="lookout-button">{busy?'Preparing PDF…':'Download PDF'}</button>}</div>{error && <p role="alert" className="lookout-section">{error}</p>}{query.isPending?<p role="status" className="lookout-section">Loading The Lookout…</p>:query.error?<p role="alert" className="lookout-section">{query.error.message} <button onClick={()=>query.refetch()} className="underline">Retry</button></p>:<LookoutPublication issue={query.data.issue}/>}</div>;
}