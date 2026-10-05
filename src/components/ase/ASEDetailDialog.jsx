import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/lib/AuthContext';
import { formatDateTime } from '@/lib/portal';
import ASEGauge from '@/components/ase/ASEGauge';
import ASEComponents from '@/components/ase/ASEComponents';
import ASESignals from '@/components/ase/ASESignals';
import ASEInsight from '@/components/ase/ASEInsight';
import ASEEvidenceTable from '@/components/ase/ASEEvidenceTable';
import ASEHistory from '@/components/ase/ASEHistory';
import ASEAssessmentControls from '@/components/ase/ASEAssessmentControls';
import { aseRequest,aseError } from '@/components/ase/aseClient';
export default function ASEDetailDialog({account,open,onOpenChange}) {
  const {user}=useAuth(),[selected,setSelected]=useState(null);
  const query=useQuery({queryKey:['ase','detail',account.id,selected,user?.id,user?.role],enabled:open,queryFn:()=>aseRequest('detail',{accountId:account.id,...(selected ? {assessmentId:selected} : {})})});
  const data=query.data, a=data?.assessment;
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto" onClick={e=>e.stopPropagation()}><DialogHeader><DialogTitle>All Seeing Eye</DialogTitle><DialogDescription>ASE, pronounced Ace · {account.name} · Internal organisational-health assessment</DialogDescription></DialogHeader>{query.isPending ? <p role="status">Loading assessment and evidence…</p> : query.error ? <p role="alert" className="text-destructive">{aseError(query.error)} <button className="underline" onClick={()=>query.refetch()}>Try again</button></p> : <div className="space-y-6">
    {a ? <><div className="flex flex-wrap items-center gap-6 rounded-xl bg-muted p-5"><div className="w-44"><ASEGauge rating={a.displayed_rating} precise={a.precise_score}/></div><div><p className="text-xs uppercase tracking-widest text-muted-foreground">ASE Rating</p><h2 className="text-3xl font-bold">{a.displayed_rating ? `${a.displayed_rating} / 5` : 'Not assessed'}</h2><p className="font-semibold">{a.rating_label}</p>{a.previous_rating!=null && <p className="text-sm">{a.change>0 ? '↑' : a.change<0 ? '↓' : '↔'} from {a.previous_rating}</p>}<p className="mt-2 text-sm">Data confidence: {a.data_confidence}</p><p className="text-xs text-muted-foreground">{formatDateTime(a.assessment_date)} · {a.organisation_type?.replaceAll('_',' ')}</p>{a.is_demo && <p className="mt-2 text-sm font-semibold text-primary">Fictional demonstration. Not for real decisions.</p>}</div></div><ASEComponents assessment={a} components={data.components}/><ASESignals assessment={a} components={data.components} evidence={data.evidence}/><ASEInsight key={a.id} accountId={account.id} assessment={a}/><ASEEvidenceTable evidence={data.evidence}/></> : <p className="rounded-xl bg-muted p-4 text-sm">No assessment has been published. Missing evidence is not a negative health rating.</p>}
    {user?.role==='admin' && <ASEAssessmentControls accountId={account.id} data={data} onAssessed={()=>setSelected(null)}/>}
    {!a && <ASEEvidenceTable evidence={data.sourceEvidence} title="Source evidence ready for assessment"/>}
    <ASEHistory key={data.current?.assessment_id || 'empty'} accountId={account.id} initial={data.history} selected={a?.id} onSelect={setSelected}/>
  </div>}</DialogContent></Dialog>;
}