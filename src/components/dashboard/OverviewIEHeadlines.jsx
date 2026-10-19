import React,{useEffect} from 'react';
import KpiIllustration from '@/components/metrics/KpiIllustration';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {BriefcaseBusiness,Layers,PoundSterling} from 'lucide-react';
import {useAuth} from '@/lib/AuthContext';
import {base44} from '@/api/base44Client';
import {ieCall,IE_ROLES} from '@/components/ie/ieClient';
import DashboardPanel from '@/components/dashboard/DashboardPanel';
import formatOverviewNumber from '@/components/dashboard/formatOverviewNumber';
export default function OverviewIEHeadlines({refreshKey}){
 const {user}=useAuth(),cache=useQueryClient(),enabled=!!user&&IE_ROLES.includes(user.role);
 const query=useQuery({queryKey:['ie-headlines',user?.id,user?.role,refreshKey],enabled,queryFn:()=>ieCall('headlines'),staleTime:60000,retry:false});
 useEffect(()=>{
  if(!enabled)return;
  const update=()=>cache.invalidateQueries({queryKey:['ie-headlines']});
  const stopEngagements=base44.entities.IEEngagement.subscribe(update),stopFinance=base44.entities.IEFinance.subscribe(update);
  return ()=>{stopEngagements();stopFinance();};
 },[enabled,user?.id,user?.role,cache]);
 if(!enabled)return null;
 const data=query.data,rows=[['Total I&E projects',data?.total,false,BriefcaseBusiness,'Recorded I&E engagements'],['Active I&E projects',data?.active,false,Layers,'Planned and live engagements'],['I&E service value',data?.serviceValue,true,PoundSterling,'All recorded I&E projects, across all statuses']];
 return <DashboardPanel title="Insights & Engagement" subtitle="All accessible I&E projects, independent of the construction portfolio filters." link="/insights-engagement" linkLabel="View I&E workspace">
  {query.isPending?<p role="status" className="py-5 text-sm text-muted-foreground">Loading I&E headline figures…</p>:query.error?<p role="alert" className="text-sm text-destructive">{query.error.message} <button className="underline" onClick={()=>query.refetch()}>Try again</button></p>:<>
   <dl className="grid gap-4 sm:grid-cols-3">{rows.map(([label,value,currency,Icon,note])=><div key={label} className="alsight-illustrated-kpi flex items-start gap-3 rounded-lg border border-border bg-secondary/40 p-4"><KpiIllustration label={label} variant={label==='I&E service value'?'projects':undefined}/><div className="min-w-0"><dt className="text-xs font-semibold">{label}</dt><dd className="mt-2 break-words text-2xl font-extrabold tabular-nums" title={value==null?'No value recorded':new Intl.NumberFormat('en-GB',currency?{style:'currency',currency:'GBP'}:{}).format(value)}>{value==null?'Not recorded':formatOverviewNumber(value,currency)}</dd><p className="mt-1 text-xs text-muted-foreground">{note}</p></div></div>)}</dl>
   <p className="mt-4 text-xs leading-5 text-muted-foreground">{formatOverviewNumber(data.withValue,false)} of {formatOverviewNumber(data.total,false)} projects have a recorded service value. Uses the imported workbook’s “Value” figure, replaced by recorded engagement finance when available; excludes construction project values and does not represent payments received.</p>
  </>}
 </DashboardPanel>;
}