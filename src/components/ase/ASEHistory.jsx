import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/portal';
import { aseRequest,aseError } from '@/components/ase/aseClient';
export default function ASEHistory({accountId,initial,onSelect,selected}) {
  const [cursor,setCursor]=useState(null),[previous,setPrevious]=useState([]);
  const query=useQuery({queryKey:['ase','history',accountId,cursor],enabled:!!cursor,queryFn:()=>aseRequest('detail',{accountId,cursor})});
  const page=cursor ? query.data?.history : initial;
  return <section><h3 className="mb-3 font-semibold">Assessment history</h3><p className="mb-3 text-xs text-muted-foreground">Each assessment retains its component scores, evidence and policy. Opening a historical assessment never recalculates it.</p>{query.error && <p className="text-destructive">{aseError(query.error)}</p>}<div className="space-y-2">{page?.items.map(row=><button key={row.id} type="button" onClick={()=>onSelect(row.id)} className={`flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-left text-sm ${selected===row.id ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}><span>{formatDateTime(row.assessment_date)} · {row.model.replaceAll('_',' ')}</span><span className="font-semibold">{row.displayed_rating ? `${row.displayed_rating}/5 · ${row.rating_label}` : 'Not assessed'} · {row.data_confidence}</span></button>)}</div><div className="mt-3 flex justify-between"><Button variant="outline" disabled={!previous.length || query.isFetching} onClick={()=>{setCursor(previous.at(-1));setPrevious(old=>old.slice(0,-1));}}>Previous</Button><Button variant="outline" disabled={!page?.has_more || query.isFetching} onClick={()=>{setPrevious(old=>[...old,cursor]);setCursor(page.next_cursor);}}>More history</Button></div></section>;
}