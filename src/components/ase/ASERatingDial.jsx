import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import ASEGauge from '@/components/ase/ASEGauge';
import allSeeingEyeText from '@/components/ase/allSeeingEyeText';
import ASEOverviewContent from '@/components/ase/ASEOverviewContent';
import ASEDetailDialog from '@/components/ase/ASEDetailDialog';
import { aseRequest,aseRoles,aseError } from '@/components/ase/aseClient';
import AlsightAttention from '@/components/AlsightAttention';
import organisationQueryPolicy from '@/components/data/organisationQueryPolicy';
export default function ASERatingDial({account,compact=false,expanded=false}) {
  const {user}=useAuth(); const [open,setOpen]=useState(false);
  const allowed=aseRoles.includes(user?.role),needsSummary=account._ase===undefined;
  const query=useQuery({queryKey:['ase','summary',account.id,'ase-v2-default',user?.id,user?.role],enabled:allowed && needsSummary,queryFn:()=>aseRequest('summary',{accountId:account.id}),staleTime:60000,...organisationQueryPolicy});
  if (!allowed) return null;
  const current=needsSummary ? query.data?.current : account._ase;
  const change=current?.change;
  const displayError=!current ? query.error : null;
  const loading=query.isFetching && needsSummary && !query.data;
  return <><button type="button" aria-haspopup="dialog" aria-label={`Open All Seeing Eye for ${account.name}`} onClick={event=>{event.preventDefault();event.stopPropagation();setOpen(true);}} className={expanded ? 'account-assessment-button w-full text-left focus-visible:outline focus-visible:outline-primary' : `flex items-center gap-4 rounded-xl border border-border bg-card p-3 text-left hover:border-primary focus-visible:outline focus-visible:outline-primary ${compact ? 'max-w-80' : 'w-full'}`}>
    {expanded ? <ASEOverviewContent current={current} loading={loading} error={displayError} /> : <>
      <div className={compact ? 'w-24 shrink-0' : 'w-36 shrink-0'}><ASEGauge rating={displayError ? null : current?.displayed_rating} precise={current?.precise_score} label={current?.rating_label} loading={loading} decimal={current?.methodology==='ASE v2'}/></div>
      <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">All Seeing Eye Rating</p><p className="text-sm font-semibold">{loading ? 'Loading…' : displayError ? 'Unavailable' : current?.rating_label || 'Not assessed'}</p>{current?.previous_rating!=null && <p className="text-xs text-muted-foreground">{change>0 ? '↑' : change<0 ? '↓' : '↔'} from {current.previous_rating}</p>}<p className="mt-1 text-xs text-muted-foreground">Data confidence: {current?.data_confidence || 'Not assessed'}</p>{current?.is_demo && <p className="text-xs font-semibold text-primary">Fictional demo</p>}</div>
    </>}
  </button>{expanded && current?.data_confidence==='Low' && <div className="mt-3"><AlsightAttention title="All Seeing Eye evidence confidence is Low" explanation="The latest assessment has recorded evidence limitations. Review its sources and coverage within ALSight; low confidence is not a conclusion about organisational performance." actions={[{label:'Review evidence',onClick:()=>setOpen(true)}]}/></div>}{expanded && change<0 && <div className="mt-3"><AlsightAttention title={`All Seeing Eye reduced from ${current.previous_rating} to ${current.displayed_rating}`} explanation={allSeeingEyeText(current.explanation) || 'The published assessment records a lower rating than the previous assessment. Review the All Seeing Eye breakdown and its supporting evidence; no financial advice is implied.'} actions={[{label:'View All Seeing Eye breakdown',onClick:()=>setOpen(true)}]}/></div>}{query.error && <p className="text-xs text-destructive">{aseError(query.error)}</p>}{open && <ASEDetailDialog account={account} open={open} onOpenChange={setOpen}/>}</>;
}