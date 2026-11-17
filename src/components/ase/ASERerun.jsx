import React,{useState} from 'react';
import {useMutation,useQueryClient} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {aseError,invalidateASE} from '@/components/ase/aseClient';
import {aseV2Request} from '@/components/ase/v2/aseV2Client';
export default function ASERerun({accountId,onAssessed}) {
  const cache=useQueryClient(),[confirmed,setConfirmed]=useState(false);
  const assess=useMutation({mutationFn:()=>aseV2Request('assess',{accountId,confirmed}),onSuccess:()=>{setConfirmed(false);invalidateASE(cache);onAssessed?.();}});
  return <section className="rounded-lg border border-border p-4"><h3 className="font-semibold">Reassess with Compass</h3>
    <label className="mt-3 flex items-start gap-2 text-xs"><input type="checkbox" checked={confirmed} disabled={assess.isPending} onChange={event=>setConfirmed(event.target.checked)}/><span>Refresh permitted sources now and publish a new Compass assessment using the approved settings. Gazette refresh is overnight only; current stored Gazette evidence is reused within its freshness limit. Unconfigured sources remain unavailable.</span></label>
    <Button className="mt-3" size="sm" disabled={!confirmed || assess.isPending} onClick={()=>assess.mutate()}>{assess.isPending?'Assessing current evidence…':'Re-run Compass'}</Button>
    {assess.isPending && <p role="status" className="mt-2 text-xs">Sources are checked in sequence to respect limits. A failed source does not become an adverse result.</p>}
    {assess.error && <p role="alert" className="mt-2 text-xs text-destructive">{aseError(assess.error)}</p>}
    {assess.isSuccess && <p role="status" className="mt-2 text-xs text-success">Compass reassessment published.</p>}
  </section>;
}