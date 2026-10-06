import React,{useState} from 'react';
import {useQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import {Button} from '@/components/ui/button';
import {aseError,invalidateASE} from '@/components/ase/aseClient';
import {aseV2Request} from '@/components/ase/v2/aseV2Client';
import ASEV2Header from '@/components/ase/v2/ASEV2Header';
import ASEV2Components from '@/components/ase/v2/ASEV2Components';
import ASEV2Sources from '@/components/ase/v2/ASEV2Sources';
import ASEV2Dependency from '@/components/ase/v2/ASEV2Dependency';
import ASEV2Inputs from '@/components/ase/v2/ASEV2Inputs';
import ASEV2PolicyEditor from '@/components/ase/v2/ASEV2PolicyEditor';
import ASEV2History from '@/components/ase/v2/ASEV2History';
import ASECommercialConcentration from '@/components/ase/ASECommercialConcentration';
import LeadershipControl from '@/components/ase/v2/LeadershipControl';
export default function ASEV2Panel({account}) {
  const {user}=useAuth(),cache=useQueryClient(),[selected,setSelected]=useState(null),[inputs,setInputs]=useState(false),[exposure,setExposure]=useState(false),[confirmed,setConfirmed]=useState(false),admin=user?.role==='admin';
  const query=useQuery({queryKey:['ase','v2',account.id,selected,user?.id,user?.role],queryFn:()=>aseV2Request('detail',{accountId:account.id,...(selected ? {assessmentId:selected} : {})})});
  const assess=useMutation({mutationFn:()=>aseV2Request('assess',{accountId:account.id,confirmed}),onSuccess:()=>{setSelected(null);setConfirmed(false);invalidateASE(cache);}});
  if(query.isPending) return <p role="status">Loading ASE v2 assessment…</p>;
  if(query.error) return <p role="alert" className="text-sm text-destructive">{aseError(query.error)} <button className="underline" onClick={()=>query.refetch()}>Try again</button></p>;
  const data=query.data,a=data.assessment;
  return <div className="space-y-5"><p className="rounded-md bg-muted p-3 text-xs">ASE v2 foundation is ready. Companies House, Gazette, existing official council evidence and structured Alliance inputs are usable now. Leadership screening uses Companies House and the official UK Sanctions List. Procurement, Environment Agency and Experian integrations remain unavailable. Individual insolvency is manual-only; no clearance is implied.</p>
    {a ? <><ASEV2Header assessment={a}/><ASEV2Components assessment={a}/><ASEV2Dependency data={a.dependency} onReview={admin ? ()=>setInputs(true) : null} onExposure={()=>setExposure(true)}/><ASEV2Sources assessment={a}/>{a.drivers?.length>0 && <section><h3 className="font-semibold">Stored assessment change drivers</h3><ul className="mt-2 space-y-2 text-xs">{a.drivers.map((driver,i)=><li key={i}>{driver}</li>)}</ul></section>}</> : <section className="rounded-lg border border-border p-5"><h2 className="font-semibold">Alliance Stability &amp; Exposure · ASE v2</h2><p className="mt-2 text-sm">No ASE v2 assessment yet. Run a fresh assessment using current eligible evidence; legacy scores are retained, not relabelled.</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{data.policy.configuration.components.map(c=><p key={c.key} className="text-xs">{c.label} · {c.weight}%</p>)}</div></section>}
    <LeadershipControl accountId={account.id} data={a?.leadership} admin={admin && !selected}/>
    {selected && <Button variant="outline" size="sm" onClick={()=>setSelected(null)}>View current assessment</Button>}
    {admin && <section className="rounded-lg border border-border p-4"><h3 className="font-semibold">Reassess with ASE v2</h3><label className="mt-3 flex items-start gap-2 text-xs"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/><span>Refresh expired approved sources and publish a new auditable assessment. Unconfigured sources remain unavailable.</span></label><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" disabled={!confirmed || assess.isPending} onClick={()=>assess.mutate()}>{assess.isPending ? 'Assessing current evidence…' : 'Re-run ASE v2'}</Button><Button size="sm" variant="outline" onClick={()=>setInputs(!inputs)}>Review Alliance evidence</Button><Button size="sm" variant="outline" onClick={()=>setExposure(!exposure)}>Review Exposure</Button></div>{assess.isPending && <p role="status" className="mt-2 text-xs">Sources are checked in sequence to respect limits. A failed source does not become an adverse result.</p>}{assess.error && <p role="alert" className="mt-2 text-xs text-destructive">{aseError(assess.error)}</p>}</section>}
    {admin && inputs && <ASEV2Inputs accountId={account.id}/>} {exposure && <ASECommercialConcentration account={account}/>}
    {admin && <ASEV2PolicyEditor key={data.policy.version} policy={data.policy}/>}<ASEV2History accountId={account.id} initial={data.history} selected={a?.id} onSelect={setSelected}/><p className="text-center text-[10px] text-muted-foreground">ASE © Jake Savage &amp; Dominic Stalker</p>
  </div>;
}