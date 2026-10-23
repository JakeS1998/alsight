import React,{useEffect} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import {base44} from '@/api/base44Client';
import {bmsRequest} from '@/components/delivery/useBmsPathway';
export default function WarrantyTrackerSummary({project}) {
 const {user}=useAuth(),cache=useQueryClient(),enabled=['admin','director','regional_director','bdm','bsm','finance'].includes(user?.role);
 const query=useQuery({queryKey:['project-warranty-tracker',project.id,user?.id,user?.role],enabled,queryFn:()=>bmsRequest({action:'operations',projectId:project.id}),staleTime:30000});
 useEffect(()=>{if(!enabled)return;return base44.entities.Warranty.subscribe(event=>{if(!event.data?.project_id||[project.id,project.dataverse_id].includes(event.data.project_id))cache.invalidateQueries({queryKey:['project-warranty-tracker',project.id]});});},[enabled,project.id,project.dataverse_id,cache]);
 if(!enabled)return null;
 const stats=query.data?.warrantyTracker;
 return <section className="space-y-3 rounded-panel border border-border bg-card p-4"><h3 className="text-sm font-semibold">Live warranty tracker</h3><p className="text-xs text-muted-foreground">Track required warranties here from appointment through handover. Status, execution and document links come from the existing warranty records, not a separate BMS tick box.</p>{query.isPending?<p role="status" className="text-sm">Loading warranty progress…</p>:query.error?<p role="alert" className="text-sm text-destructive">Tracker unavailable. <button type="button" className="underline" onClick={()=>query.refetch()}>Retry</button></p>:<dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Tracked',stats.total],['Executed / complete',stats.complete],['Complete and filed',stats.filed],['Overdue',stats.overdue]].map(([label,value])=><div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="text-xl font-semibold">{value}</dd></div>)}</dl>}</section>;
}