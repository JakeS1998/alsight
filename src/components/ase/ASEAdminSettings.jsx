import React from 'react';
import { useQuery,useMutation,useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import ASEPolicyEditor from '@/components/ase/ASEPolicyEditor';
import allSeeingEyeText from '@/components/ase/allSeeingEyeText';
import ASEAutomationPanel from '@/components/ase/ASEAutomationPanel';
import { aseRequest,aseError,invalidateASE } from '@/components/ase/aseClient';
export default function ASEAdminSettings() {
  const {user}=useAuth(),cache=useQueryClient();
  const query=useQuery({queryKey:['ase','policy',user?.id],enabled:user?.role==='admin',queryFn:()=>aseRequest('policy')});
  const seed=useMutation({mutationFn:()=>aseRequest('seed'),onSuccess:()=>{invalidateASE(cache);query.refetch();}});
  if (user?.role!=='admin') return <p>All Seeing Eye policy management is administrator-only.</p>;
  return <div className="space-y-6"><div><h2 className="text-xl font-semibold">All Seeing Eye</h2><p className="mt-2 text-sm text-muted-foreground">Internal-only. AI never chooses a rating. Company and council models use the approved deterministic policy.</p></div>{query.isPending ? <p role="status">Loading All Seeing Eye policy…</p> : query.error ? <p role="alert" className="text-destructive">{aseError(query.error)} <button className="underline" onClick={()=>query.refetch()}>Try again</button></p> : <><p className="text-xs text-muted-foreground">Current policy: {allSeeingEyeText(query.data.policy.version)}</p><ASEPolicyEditor key={query.data.policy.version} policy={query.data.policy} onSaved={()=>query.refetch()}/></>}<ASEAutomationPanel/><section className="rounded-xl border border-border bg-card p-5"><h3 className="font-semibold">Fictional demonstration evidence</h3><p className="my-3 text-sm text-muted-foreground">Two clearly labelled fictional Accounts demonstrate company and English council assessments, historical comparisons and evidence sources. No real organisation receives synthetic financial data.</p><Button variant="outline" disabled={seed.isPending} onClick={()=>seed.mutate()}>{seed.isPending ? 'Preparing sample assessments…' : 'Prepare / open demo Accounts'}</Button>{seed.error && <p role="alert" className="mt-3 text-destructive">{aseError(seed.error)}</p>}<div className="mt-3 space-y-2">{(seed.data?.accounts || []).map(account=><Link className="block text-sm underline" key={account.id} to={`/accounts/${account.id}`}>{account.name}</Link>)}</div></section></div>;
}