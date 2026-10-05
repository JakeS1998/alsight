import React, { useState } from 'react';
import { useMutation,useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import ASEEvidenceForm from '@/components/ase/ASEEvidenceForm';
import { aseRequest,aseError,invalidateASE } from '@/components/ase/aseClient';
export default function ASEAssessmentControls({accountId,data,onAssessed}) {
  const cache=useQueryClient(),[show,setShow]=useState(false);
  const calculate=useMutation({mutationFn:()=>aseRequest('assess',{accountId}),onSuccess:()=>{invalidateASE(cache);onAssessed();}});
  if (!data.model) return <p className="rounded-lg border border-border p-4 text-sm">To assess this organisation, set its organisation type in Account details to UK Limited Company, UK PLC or English Local Authority. Other organisation models are not yet supported.</p>;
  return <section className="rounded-xl border border-border p-4"><h3 className="font-semibold">Assessment administration</h3><p className="mt-2 text-xs text-muted-foreground">{data.sourceEvidence.length} source records available. Evidence is copied into an immutable historical snapshot when you calculate; new evidence and weightings never rewrite previous results.</p><div className="mt-3 flex flex-wrap gap-2"><Button variant="outline" onClick={()=>setShow(old=>!old)}>{show ? 'Close evidence form' : 'Add evidence'}</Button><Button disabled={calculate.isPending || data.sourceHasMore} onClick={()=>calculate.mutate()}>{calculate.isPending ? 'Calculating and preserving evidence…' : 'Calculate new assessment'}</Button></div>{data.sourceHasMore && <p className="mt-2 text-sm text-destructive">Evidence exceeds the 100-record assessment limit.</p>}{calculate.error && <p role="alert" className="mt-3 text-sm text-destructive">{aseError(calculate.error)}</p>}{show && <ASEEvidenceForm accountId={accountId} rules={data.policy.models[data.model]} onSaved={()=>invalidateASE(cache)}/>}</section>;
}