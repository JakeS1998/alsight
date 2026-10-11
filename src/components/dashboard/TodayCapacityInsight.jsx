import React from 'react';
import { Link } from 'react-router-dom';
import useDeliveryCapacity from '@/components/dashboard/useDeliveryCapacity';
export default function TodayCapacityInsight({dashboard}) {
  const query=useDeliveryCapacity({user:dashboard.user,projectIds:dashboard.projects.map(p=>p.id).sort(),revision:dashboard.scopeKey,personal:true,enabled:dashboard.internal && !dashboard.projectsLoading});
  if(!dashboard.internal)return null;
  if(query.isPending)return <p role="status" className="text-xs text-muted-foreground">Checking delivery commitments…</p>;
  if(query.error)return <p className="text-xs text-muted-foreground">Delivery commitments unavailable. <button onClick={()=>query.refetch()} className="underline">Try again</button></p>;
  const data=query.data;
  if(!data || !data.active)return null;
  const management=['admin','director','regional_director'].includes(dashboard.role);
  return <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm"><p>{management ? `Your visible team has ${data.active} active projects; ${data.windows[0].projects} have commitments in the next 30 days.` : `You are assigned to ${data.active} active projects; ${data.windows[0].projects} have commitments in the next 30 days.`}{management && data.concentrated>0 ? ` ${data.concentrated} project managers show concentrated relative workload signals.` : ''}</p><p className="mt-1 text-xs text-muted-foreground">Recorded commitments, not employee utilisation. <Link to={management ? '/portfolio-overview' : '/projects'} className="font-semibold text-chart-2 underline">Review {management ? 'delivery capacity' : 'projects'}</Link></p></div>;
}