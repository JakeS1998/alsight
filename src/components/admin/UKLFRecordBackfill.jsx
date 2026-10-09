import React, {useState} from 'react';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
export default function UKLFRecordBackfill() {
 const cache=useQueryClient(),[running,setRunning]=useState(false),[progress,setProgress]=useState(null),[error,setError]=useState('');
 const query=useQuery({queryKey:['uklf-record-creation'],queryFn:async()=>{const {data}=await base44.functions.invoke('manageUKLFRecords',{action:'status'});return data;},retry:false});
 const state=progress || query.data?.state;
 const run=async()=>{
  setRunning(true);setError('');
  try{let more=true;while(more){const {data}=await base44.functions.invoke('manageUKLFRecords',{action:'backfill'});if(data.error)throw new Error(data.error);setProgress(data.state);more=data.has_more;}
   cache.invalidateQueries({queryKey:['uklf-record-creation']});cache.invalidateQueries({queryKey:['framework-workspace']});cache.invalidateQueries({queryKey:['framework-project-detail']});
  }catch(e){setError(e.message);}finally{setRunning(false);}
 };
 return <section className="space-y-4 rounded-panel border border-border bg-card p-5"><div><h2 className="font-heading text-lg font-semibold">UKLF project records</h2><p className="mt-1 text-sm text-muted-foreground">Create missing UKLF records for Framework projects. Existing reports and KPIs are preserved; available project details and document milestones are copied. New Framework projects are handled automatically.</p></div>
  {query.isPending ? <p role="status">Loading UKLF progress…</p> : query.error ? <p role="alert" className="text-sm text-destructive">{query.error.message} <button className="underline" onClick={()=>query.refetch()}>Try again</button></p> : <><p className="text-sm">{query.data.eligible} qualifying projects · {state?.processed || 0} checked · {state?.created || 0} created · {state?.reused || 0} reused</p><Button disabled={running} onClick={run}>{running ? 'Creating UKLF records…' : state?.status==='running' ? 'Resume backfill' : state?.status==='completed' ? 'Check for missing records again' : 'Create missing UKLF records'}</Button>{state?.status==='completed' && !running && <p role="status" className="text-sm text-success">Backfill completed.</p>}</>}
  {error && <p role="alert" className="text-sm text-destructive">{error} Progress is saved; resume to continue safely.</p>}
  {!!state?.conflicts?.length && <div className="text-sm"><p className="font-semibold">{state.conflicts.length} project links need review in <Link to="/framework-reports" className="underline">Framework360</Link>.</p><ul className="mt-2 space-y-1">{state.conflicts.map(row=><li key={row.project_id}>{row.project_number || row.name}: {row.reason}</li>)}</ul></div>}
 </section>;
}