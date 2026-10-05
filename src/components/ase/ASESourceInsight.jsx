import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { aseError } from '@/components/ase/aseClient';
import { aseSourceRequest } from '@/components/ase/useASESources';
export default function ASESourceInsight({accountId,source,audit,admin}) {
  const analyse=useMutation({mutationFn:()=>aseSourceRequest('analyse',{accountId,source})});
  const insight=analyse.data?.insight || audit.summary?.ai_insight;
  return <div className="mt-3">{admin && <Button size="sm" variant="outline" disabled={analyse.isPending} onClick={()=>analyse.mutate()}>{analyse.isPending ? 'ALICE is reading source facts…' : 'ALICE source summary'}</Button>}{analyse.error && <p role="alert" className="mt-2 text-xs text-destructive">{aseError(analyse.error)}</p>}{insight?.length>0 && <><p className="mt-2 text-xs font-semibold">AI summary, not a rating or approval</p><ul className="mt-2 space-y-2 text-xs">{insight.map((item,index)=><li key={index}>{item.text} <a className="underline" href={`#ase-evidence-${item.evidence_id}`}>Evidence</a></li>)}</ul></>}</div>;
}