import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import LoadingPanel from '@/components/loading/LoadingPanel';
export default function PageContentSkeleton({header=true,label='Loading page',cards=4}) {
 return <div className="space-y-5" role="status" aria-label={label} aria-busy="true">
  <span className="sr-only">{label}…</span>
  {header&&<Skeleton className="h-52 w-full rounded-panel"/>}
  {cards>0&&<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({length:cards},(_,index)=><LoadingPanel key={index} rows={0}/>)}</div>}
  <div className="grid gap-5 lg:grid-cols-2"><LoadingPanel rows={4}/><LoadingPanel rows={4}/></div>
 </div>;
}