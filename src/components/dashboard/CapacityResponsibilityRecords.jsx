import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useDeliveryCapacity from '@/components/dashboard/useDeliveryCapacity';
export default function CapacityResponsibilityRecords({options,owner,role}) {
  const [offset,setOffset]=useState(0);
  const query=useDeliveryCapacity({...options,action:'intelligence',person:owner,responsibilityRole:role,offset});
  if(query.isPending)return <p role="status" className="text-xs text-muted-foreground">Loading linked responsibilities…</p>;
  if(query.error)return <p role="alert" className="text-xs text-destructive">{query.error.message} <button onClick={()=>query.refetch()} className="underline">Try again</button></p>;
  const page=query.data?.recordPage;
  return <div className="space-y-2"><ul className="space-y-1">{page?.items.map(record=><li key={record.kind+record.id} className="text-xs"><Link to={record.href} className="text-chart-2 underline">{record.label}</Link><span className="ml-2 text-muted-foreground">{record.kind==='project' ? 'Project' : 'Opportunity'}</span></li>)}</ul>{!page?.items.length && <p className="text-xs text-muted-foreground">No linked records in this selection.</p>}<div className="flex gap-3 text-xs">{offset>0 && <button onClick={()=>setOffset(value=>Math.max(0,value-10))} className="underline">Previous</button>}{page?.nextOffset!=null && <button onClick={()=>setOffset(page.nextOffset)} className="underline">Next</button>}</div></div>;
}