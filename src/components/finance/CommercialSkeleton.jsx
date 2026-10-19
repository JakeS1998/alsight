import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import LoadingPanel from '@/components/loading/LoadingPanel';
export default function CommercialSkeleton() {
 return <div role="status" aria-label="Loading commercial reports" aria-busy="true" className="space-y-6">
  <span className="sr-only">Loading commercial reports…</span>
  <div className="rounded-panel border border-border bg-card p-6 space-y-6" aria-hidden="true"><div className="grid gap-6 md:grid-cols-2"><div className="space-y-4"><Skeleton className="h-4 w-28"/><Skeleton className="h-14 w-3/4"/><Skeleton className="h-4 w-1/2"/></div><div className="space-y-3"><Skeleton className="h-3 w-full"/><Skeleton className="h-3 w-full"/><Skeleton className="h-3 w-2/3"/></div></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0,1,2,3].map(index=><LoadingPanel key={index} rows={0}/>)}</div></div>
  <LoadingPanel chart rows={2}/>
  <div className="grid gap-6 lg:grid-cols-2"><LoadingPanel rows={4}/><LoadingPanel rows={4}/></div>
 </div>;
}