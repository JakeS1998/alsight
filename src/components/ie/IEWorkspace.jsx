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
import IEDepartmentProjects from '@/components/ie/IEDepartmentProjects';
import {Tabs,TabsList,TabsContent} from '@/components/ui/tabs';
import TabsTrigger from '@/components/navigation/SlidingTabTrigger';
import SlidingTabHighlight from '@/components/navigation/SlidingTabHighlight';
import '@/components/ie/ie-dashboard.css';
import '@/components/ie/ie-dashboard-cards.css';
export default function IEWorkspace(){
 const {user}=useAuth(),[creating,setCreating]=useState(false),[settings,setSettings]=useState(false);
 const summary=useQuery({queryKey:['ie-summary',user.id,user.role],queryFn:()=>ieCall('summary'),retry:false});
 const types=useQuery({queryKey:['ie-classifications',user.id],queryFn:()=>ieCall('classifications'),staleTime:60000,retry:false});
 const classifications=types.data?.items||[];
 const actions=<>{['admin','sam_director'].includes(user.role)&&<Button variant="ghost" onClick={()=>setSettings(true)}><Settings2/>Products</Button>}{IE_EDIT_ROLES.includes(user.role)&&<Button onClick={()=>setCreating(true)}><Plus/>New engagement</Button>}</>;
 return <div className="ie-dashboard"><IEWorkspaceHeader/><IEQueryState query={summary}><IEKpis data={summary.data}/></IEQueryState>{types.error&&<p role="alert" className="mb-3 text-xs text-destructive">Products unavailable. {types.error.message}</p>}<Tabs defaultValue="engagements"><TabsList className="sliding-tab-list mb-4" aria-label="I&E workspace"><SlidingTabHighlight/><TabsTrigger value="engagements">Engagements</TabsTrigger><TabsTrigger value="projects">Projects</TabsTrigger></TabsList><TabsContent value="engagements"><IERegister classifications={classifications} actions={actions}>{onFilter=><IEDashboardAside query={summary} classifications={classifications} onFilter={onFilter}/>}</IERegister></TabsContent><TabsContent value="projects"><IEDepartmentProjects/></TabsContent></Tabs>{creating&&<IEEngagementForm onClose={()=>setCreating(false)}/>} {settings&&<IEClassificationEditor onClose={()=>setSettings(false)}/>}</div>;
}