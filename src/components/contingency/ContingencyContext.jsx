import React,{createContext,useContext,useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
import {actors,initialState} from '@/components/contingency/demoData';
const Context=createContext(null);
export const useContingency=()=>useContext(Context);
export default function ContingencyContext({children}){
 const {user}=useAuth(),client=useQueryClient(),[actorId,setActorId]=useState(actors[0].id),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const key=['contingency-demo',user.id],q=useQuery({queryKey:key,queryFn:async()=>{const page=await base44.entities.ContingencyIncident.filter({sandbox_owner:user.id},{sort:'-created_date',limit:1});return page.items[0]||await base44.entities.ContingencyIncident.create({sandbox_owner:user.id,simulation:true,demo_state:initialState()});},staleTime:Infinity});
 const actor=actors.find(a=>a.id===actorId),state=q.data?.demo_state;
 async function commit(action,transform,details={}){if(busy)return;setBusy(true);setError('');setNotice('');try{const next=transform(structuredClone(state));const at=new Date().toISOString();await base44.entities.ContingencyAuditLog.create({sandbox_owner:user.id,user:`${actor.name} (${actor.role}, demo)`,action,occurred_at:at,incident_reference:next.reference||'',previous_value:state.status,new_value:next.status,approval_status:details.approval||'',transaction_reference:details.transaction||'',reconciliation_status:details.reconciliation||'',simulation:true});const saved=await base44.entities.ContingencyIncident.update(q.data.id,{demo_state:next});client.setQueryData(key,saved);client.invalidateQueries({queryKey:['contingency-audit']});setNotice(`${action} — simulation saved.`);}catch(e){setError(e.message||'Unable to save this demonstration.');}finally{setBusy(false);}}
 if(q.isPending)return <div className="p-8" role="status">Loading contingency demonstration…</div>;
 if(q.error)return <div className="p-8 text-destructive">Unable to load demonstration. <button onClick={()=>q.refetch()}>Retry</button></div>;
 return <Context.Provider value={{state,actor,actorId,setActorId,commit,busy,user}}>{error&&<div role="alert" className="m-4 rounded-panel border border-destructive p-3 text-destructive">{error}</div>}{notice&&<div role="status" className="mx-4 mt-4 text-sm text-success">{notice}</div>}{children}</Context.Provider>;
}