import React from 'react';
import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
export default function SupplierCommission({account,compact=false}){
 const {user}=useAuth();
 const allowed=['admin','director','regional_director','bsm','finance','bdm'].includes(user?.role);
 const query=useQuery({queryKey:['supplier-commission',account?.id,user?.id,user?.role],enabled:allowed&&!!account?.id,staleTime:300000,retry:false,queryFn:async()=>{const {data}=await base44.functions.invoke('getSupplierCommission',{accountId:account.id});if(data.error)throw new Error(data.error);return data;}});
 if(!allowed||!account?.id)return null;
 const value=query.isPending?'Loading…':query.error?'Unavailable':query.data.average==null?'Not available':`${query.data.average.toFixed(2)}%`;
 const help='Project-value-weighted average: average the recorded rates within each project, then weight each project once by its full value excluding VAT. Only accessible, uniquely linked projects with a positive value are included.';
 return <div className={compact?'mt-1 text-xs text-muted-foreground':'account-panel'} title={help}>
  {!compact&&<h2>Average commission</h2>}
  <p className={compact?'':'mt-3 text-sm'}>{compact?'Average commission: ':''}<strong className="text-foreground">{value}</strong></p>
  {!compact&&<p className="mt-2 text-xs text-muted-foreground">{help}{query.data&&` Based on ${query.data.projects} projects; ${query.data.excluded} unlinked, inaccessible or unvalued project groups excluded.`}</p>}
 </div>;
}