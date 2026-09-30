import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
export default function DashboardSkeleton({ internal }) {
  return <div role="status" aria-label="Loading dashboard" className="space-y-8">
    <span className="sr-only">Loading your dashboard…</span>
    <div aria-hidden="true" className="space-y-3"><Skeleton className="h-4 w-28" /><Skeleton className="h-8 w-52" /><Skeleton className="h-4 w-72 max-w-full" /></div>
    <div aria-hidden="true" className="grid grid-cols-2 gap-4 xl:grid-cols-4">{[0, 1, 2, 3].map(item => <Skeleton key={item} className="h-40 rounded-2xl" />)}</div>
    {internal && <div aria-hidden="true" className="space-y-6"><div className="grid grid-cols-2 gap-3"><Skeleton className="h-28 rounded-2xl" /><Skeleton className="h-28 rounded-2xl" /></div><Skeleton className="h-56 rounded-2xl" /><div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div></div>}
    <Skeleton aria-hidden="true" className="h-[465px] rounded-2xl" />
    <Skeleton aria-hidden="true" className="h-72 rounded-2xl" />
  </div>;
}