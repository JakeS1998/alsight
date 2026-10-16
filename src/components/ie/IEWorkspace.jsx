import React,{useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Plus,Settings2} from 'lucide-react';
import {useAuth} from '@/lib/AuthContext';
import {ieCall,IE_EDIT_ROLES} from '@/components/ie/ieClient';
import {Button} from '@/components/ui/button';
import IEWorkspaceHeader from '@/components/ie/IEWorkspaceHeader';
import IEKpis from '@/components/ie/IEKpis';
import IEQueryState from '@/components/ie/IEQueryState';
import IERegister from '@/components/ie/IERegister';
import IEDashboardAside from '@/components/ie/IEDashboardAside';
import IEEngagementForm from '@/components/ie/IEEngagementForm';
import IEClassificationEditor from '@/components/ie/IEClassificationEditor';
import '@/components/ie/ie-dashboard.css';
export default function IEWorkspace(){
 const {user}=useAuth(),[creating,setCreating]=useState(false),[settings,setSettings]=useState(false);
 const summary=useQuery({queryKey:['ie-summary',user.id,user.role],queryFn:()=>ieCall('summary'),retry:false});
 const types=useQuery({queryKey:['ie-classifications',user.id],queryFn:()=>ieCall('classifications'),staleTime:60000,retry:false});
 const classifications=types.data?.items||[];
 const actions=<>{['admin','sam_director'].includes(user.role)&&<Button variant="ghost" onClick={()=>setSettings(true)}><Settings2/>Service types</Button>}{IE_EDIT_ROLES.includes(user.role)&&<Button onClick={()=>setCreating(true)}><Plus/>New engagement</Button>}</>;
 return <div className="ie-dashboard"><IEWorkspaceHeader/><IEQueryState query={summary}><IEKpis data={summary.data}/></IEQueryState>{types.error&&<p role="alert" className="mb-3 text-xs text-destructive">Service types unavailable. {types.error.message}</p>}<IERegister classifications={classifications} actions={actions}>{onFilter=><IEDashboardAside query={summary} classifications={classifications} onFilter={onFilter}/>}</IERegister>{creating&&<IEEngagementForm onClose={()=>setCreating(false)}/>} {settings&&<IEClassificationEditor onClose={()=>setSettings(false)}/>}</div>;
}