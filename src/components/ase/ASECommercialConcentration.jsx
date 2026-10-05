import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { aseRequest,aseError } from '@/components/ase/aseClient';
import ASECommercialFigures from '@/components/ase/ASECommercialFigures';
import ASECommercialContractReview from '@/components/ase/ASECommercialContractReview';
import ASEHmrcStatus from '@/components/ase/ASEHmrcStatus';
export default function ASECommercialConcentration({account,card=false,snapshot}) {
  const {user}=useAuth(),[cursor,setCursor]=useState(null),[showReview,setShowReview]=useState(false);
  const query=useQuery({queryKey:['ase','commercial',account.id,'blackflag-linked-jct-v2',cursor,user?.id,user?.role],enabled:!snapshot,queryFn:()=>aseRequest('commercial',{accountId:account.id,...(cursor ? {cursor} : {})}),staleTime:60000});
  const data=snapshot || query.data;
  return <section className={card ? 'account-panel' : 'rounded-xl border border-border bg-card p-4'}><h2 className="font-semibold">ASE · Commercial concentration</h2><p className="mb-4 mt-2 text-xs text-muted-foreground">Internal indicative comparison only. Does not change the ASE rating. {snapshot ? 'Historical context, not recalculated from today’s contracts.' : 'Current accessible contracts, not a complete portfolio assertion.'}</p>{!snapshot && query.isPending ? <p role="status" className="text-sm">Checking contracts and turnover evidence…</p> : !snapshot && query.error ? <p role="alert" className="text-sm text-destructive">{aseError(query.error)} <button className="underline" onClick={()=>query.refetch()}>Try again</button></p> : data?.status==='not_applicable' ? <p className="text-sm text-muted-foreground">{data.reason}</p> : data && <><ASECommercialFigures data={data} historical={!!snapshot}/>{!snapshot && (data.has_more || cursor) && <div className="mt-3 flex gap-2">{cursor && <Button variant="outline" size="sm" onClick={()=>setCursor(null)}>First contract page</Button>}{data.has_more && <Button variant="outline" size="sm" onClick={()=>setCursor(data.next_cursor)}>Next contract page</Button>}</div>}{data.hmrc && (card || snapshot) && <div className="mt-4"><ASEHmrcStatus status={data.hmrc}/></div>}{!snapshot && <><Button className="mt-4" variant="outline" size="sm" onClick={()=>setShowReview(!showReview)}>{showReview ? 'Hide signed contracts' : 'View / verify signed contracts'}</Button>{showReview && <ASECommercialContractReview accountId={account.id}/>}</>}</>}</section>;
}