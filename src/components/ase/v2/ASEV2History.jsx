import React,{useState,useEffect} from 'react';
import {useMutation} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {formatDateTime} from '@/lib/portal';
import {aseError} from '@/components/ase/aseClient';
import {aseV2Request} from '@/components/ase/v2/aseV2Client';
export default function ASEV2History({accountId,initial,onSelect,selected}) {
  const [page,setPage]=useState(initial),[rows,setRows]=useState(initial.items);
  useEffect(()=>{setPage(initial);setRows(initial.items);},[initial]);
  const more=useMutation({mutationFn:()=>aseV2Request('history',{accountId,cursor:page.next_cursor}),onSuccess:data=>{setPage(data.history);setRows(r=>[...r,...data.history.items]);}});
  return <section><h3 className="font-semibold">ASE v2 assessment history</h3>{!rows.length && <p className="mt-2 text-xs text-muted-foreground">Run the first ASE v2 assessment. Existing legacy assessments remain in the legacy tab.</p>}<div className="mt-2 space-y-2">{rows.map(row=><button key={row.id} onClick={()=>onSelect(row.id)} aria-pressed={selected===row.id} className="w-full rounded-md border border-border p-3 text-left hover:border-primary"><p className="text-sm font-semibold">{formatDateTime(row.assessment_date)} · {row.final_score===null ? 'Not assessed' : `ASE ${row.final_score.toFixed(1)}`} · {row.classification}</p><p className="mt-1 text-xs text-muted-foreground">{row.confidence} confidence · {row.coverage.toFixed(1)}% coverage</p></button>)}</div>{page.has_more && <Button className="mt-3" size="sm" variant="outline" disabled={more.isPending} onClick={()=>more.mutate()}>{more.isPending ? 'Loading…' : 'Load more assessments'}</Button>}{more.error && <p role="alert" className="mt-2 text-xs text-destructive">{aseError(more.error)}</p>}</section>;
}