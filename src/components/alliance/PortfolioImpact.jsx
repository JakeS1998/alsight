import React from 'react';
import {useQuery} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import AllianceImpact from '@/components/alliance/AllianceImpact';
import allianceRequest,{allianceError} from '@/components/alliance/allianceClient';
export default function PortfolioImpact({projectIds}) {
  const {user}=useAuth();
  const query=useQuery({queryKey:['alliance-layer','impact',user?.id,user?.role,projectIds],queryFn:()=>allianceRequest('impact',{projectIds}),staleTime:60000,refetchOnWindowFocus:false});
  if(query.isPending) return <section role="status" className="rounded-panel border border-border bg-card p-6 text-sm text-muted-foreground">Building the Alliance impact story from accessible project records…</section>;
  if(query.error) return <section role="alert" className="rounded-panel border border-border bg-card p-6 text-sm text-destructive">{allianceError(query.error)} <button className="underline" onClick={()=>query.refetch()}>Try again</button></section>;
  return <AllianceImpact data={query.data} collapsible/>;
}