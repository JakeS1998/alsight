import React from 'react';
import { Link } from 'react-router-dom';
import useDeliveryCapacity from '@/components/dashboard/useDeliveryCapacity';
export default function TodayCapacityInsight({dashboard}) {
  const query=useDeliveryCapacity({user:dashboard.user,projectIds:dashboard.projects.map(p=>p.id).sort(),revision:dashboard.scopeKey,personal:true,action:'intelligence',enabled:dashboard.internal && !dashboard.projectsLoading});
  if(!dashboard.internal)return null;
  if(query.isPending)return <p role="status" className="text-xs text-muted-foreground">Checking delivery commitments…</p>;
  if(query.error)return <p className="text-xs text-muted-foreground">Delivery commitments unavailable. <button onClick={()=>query.refetch()} className="underline">Try again</button></p>;
  const data=query.data?.organisation;
  if(!data || (!data.summary.projects && !data.personal.opportunities))return null;
  const management=['admin','director','regional_director'].includes(dashboard.role);
  return <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm"><p>{management ? `Your visible team has ${data.summary.projects} active live projects; ${data.summary.near} have commitments within 30 days.` : `Your project responsibilities: ${data.personal.bdm} as BDM, ${data.personal.bsm} as BSM; ${data.summary.near} assigned projects have commitments within 30 days.`}{!management && data.personal.opportunities>0 && ` You own ${data.personal.opportunities} visible active opportunities.`}</p>{management && data.insights[0] && <p className="mt-1 text-xs">{data.insights[0].title}. Review continuity and coordination, not individual performance.</p>}{data.summary.next[0] && <p className="mt-1 text-xs"><Link to={data.summary.next[0].href} className="text-chart-2 underline">{data.summary.next[0].label}</Link>: {data.summary.next[0].date} · {data.summary.next[0].label===data.summary.next[0].eventLabel ? '' : 'upcoming milestone'}</p>}<p className="mt-1 text-xs text-muted-foreground">Recorded responsibilities are not confirmed availability. <Link to={management ? '/portfolio-overview' : '/projects'} className="font-semibold text-chart-2 underline">Review {management ? 'people & delivery capacity' : 'projects'}</Link></p></div>;
}