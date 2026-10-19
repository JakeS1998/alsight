import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import LoadingPanel from '@/components/loading/LoadingPanel';
export default function AdaptiveWorkspaceSkeleton({contentOnly=false}) {
 const content=<div role="status" aria-label="Loading your working day" aria-busy="true" className="space-y-5">
  <span className="sr-only">Loading your working day…</span>
  {!contentOnly&&<><Skeleton className="h-64 w-full rounded-panel"/><div className="flex flex-wrap justify-center gap-2" aria-hidden="true">{[0,1,2,3,4].map(index=><Skeleton key={index} className="h-9 w-28 rounded-full"/>)}</div></>}
  <div className="at-metrics" aria-hidden="true">{['attention','diary','tasks','approvals','projects'].map(tone=><div key={tone} className="at-metric" data-tone={tone}><Skeleton className="h-8 w-8 shrink-0 rounded-lg"/><div className="w-full min-w-0 space-y-2"><Skeleton className={tone==='attention'?'h-10 w-1/2':'h-6 w-1/3'}/><Skeleton className="h-3 w-3/4"/><Skeleton className="h-3 w-full"/></div></div>)}</div>
  <Skeleton className="h-10 w-3/4"/>
  <div className="at-flow-grid"><div className="at-flow-priorities"><LoadingPanel rows={5}/></div><div className="at-flow-diary"><LoadingPanel rows={4}/></div><div className="at-flow-recommendations"><LoadingPanel rows={2}/></div><div className="at-flow-intelligence"><LoadingPanel rows={2}/></div><div className="at-flow-workspace grid gap-4 sm:grid-cols-2"><LoadingPanel rows={3}/><LoadingPanel rows={3}/></div></div>
 </div>;
 return contentOnly?content:<div className="adaptive-today"><div className="at-container">{content}</div></div>;
}