import React from 'react';
import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { aseError,invalidateASE } from '@/components/ase/aseClient';
import { formatDateTime } from '@/lib/portal';
async function request(action,accountId) {const {data}=await base44.functions.invoke('manageCompaniesHouse',{action,accountId});if(data.error) throw new Error(data.error);return data;}
export default function ASERegistrySource({accountId,model,admin}) {
  const cache=useQueryClient(),applicable=model!=='english_local_authority';
  const query=useQuery({queryKey:['ase','registry',accountId],enabled:applicable,queryFn:()=>request('read',accountId)});
  const refresh=useMutation({mutationFn:()=>request('refresh',accountId),onSuccess:()=>{invalidateASE(cache);cache.invalidateQueries({queryKey:['companies-house',accountId]});}});
  const audit=query.data?.audit;
  return <article className="rounded-lg border border-border bg-card p-4"><h4 className="font-semibold">Companies House Public Data API</h4><p className="mt-2 text-xs text-muted-foreground">Corporate identity, filings, officers, persons with significant control, charges and insolvency. Full registry details remain in the Account overview.</p>{!applicable ? <p className="mt-3 text-xs text-muted-foreground">Company source: not applicable to an English council.</p> : <><p className="mt-3 text-xs">{query.isPending ? 'Loading saved registry status…' : audit ? `Last collection: ${formatDateTime(audit.refreshed_at)} · ${audit.status}` : 'Not collected for the current Company Number'}</p>{(query.error || refresh.error) && <p role="alert" className="mt-2 text-xs text-destructive">{aseError(query.error || refresh.error)}</p>}{query.data?.lastAttempt?.status==='failed' && <p className="mt-2 text-xs text-destructive">Last collection failed: {query.data.lastAttempt.error}</p>}{admin && <Button className="mt-3" size="sm" variant="outline" disabled={refresh.isPending} onClick={()=>refresh.mutate()}>{refresh.isPending ? 'Collecting registry evidence…' : 'Refresh registry evidence'}</Button>}{refresh.isSuccess && <p className="mt-2 text-xs text-success">{refresh.data.evidenceCount} registry evidence records updated. Existing assessment unchanged.</p>}</>}</article>;
}