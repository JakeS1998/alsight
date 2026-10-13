import React from 'react';
import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
import SupplierCommissionProjects from '@/components/accounts/SupplierCommissionProjects';
export default function SupplierCommission({account,compact=false}){
 const {user}=useAuth();
 const allowed=['admin','director','regional_director','bsm','finance','bdm'].includes(user?.role);
 const query=useQuery({queryKey:['supplier-commission',account?.id,user?.id,user?.role],enabled:allowed&&!!account?.id,staleTime:300000,retry:false,queryFn:async()=>{const {data}=await base44.functions.invoke('getSupplierCommission',{accountId:account.id});if(data.error)throw new Error(data.error);return data;}});
 if(!allowed||!account?.id||query.data?.eligible===false)return null;
 const value=query.isPending?'Loading…':query.error?'Unavailable':query.data.average==null?'Not available':`${query.data.average.toFixed(2)}%`;
 const help='Project-value-weighted average: average the recorded rates within each project, then weight each project once by its full value excluding VAT. Only accessible, uniquely linked projects with a positive value are included.';
 return <div className={compact?'mt-1 text-xs text-muted-foreground':'min-w-0 rounded-lg border border-border bg-card px-4 py-3'} title={help}>
  {compact ? <p>Average commission: <strong className="text-foreground">{value}</strong></p> : <>
   <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xs font-semibold">Average commission</h2><strong className="text-base tabular-nums text-foreground">{value}</strong></div>
   {query.data && <p className="mt-1 text-[11px] text-muted-foreground">Project-value weighted · {query.data.projects} {query.data.projects===1?'project':'projects'}</p>}
   <details className="mt-1 text-[11px] text-muted-foreground"><summary className="cursor-pointer">Calculation details</summary><p className="mt-2 leading-relaxed">{help}{query.data&&` Based on ${query.data.projects} projects; ${query.data.excluded} unlinked, inaccessible or unvalued project groups excluded.`}</p></details>
  {query.data?.eligible && <SupplierCommissionProjects projects={query.data.recent_projects}/>}
  </>}
  </div>;
}