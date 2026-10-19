import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
export default function LoadingPanel({className='',rows=3,chart=false,framed=true}) {
 return <div className={`${framed?'rounded-panel border border-border bg-card p-5':''} min-w-0 space-y-4 ${className}`} aria-hidden="true">
  <Skeleton className="h-5 w-2/5"/>
  <Skeleton className="h-3 w-3/5"/>
  {chart&&<Skeleton className="h-56 w-full rounded-lg"/>}
  {Array.from({length:rows},(_,index)=><div key={index} className="flex items-center gap-3 border-t border-border/50 pt-4"><Skeleton className="h-9 w-9 shrink-0 rounded-lg"/><div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-3 w-3/4"/><Skeleton className="h-3 w-1/2"/></div></div>)}
 </div>;
}