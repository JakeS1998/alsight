import React,{useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Plus,Settings2} from 'lucide-react';
import {useAuth} from '@/lib/AuthContext';
import {ieCall,IE_EDIT_ROLES} from '@/components/ie/ieClient';
import {Button} from '@/components/ui/button';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import IEPanel from '@/components/ie/IEPanel';
import IEKpis from '@/components/ie/IEKpis';
import IEWorkList from '@/components/ie/IEWorkList';
import IEQueryState from '@/components/ie/IEQueryState';
import IERegister from '@/components/ie/IERegister';
import IEEngagementForm from '@/components/ie/IEEngagementForm';
import IEClassificationEditor from '@/components/ie/IEClassificationEditor';
export default function IEWorkspace(){
 const {user}=useAuth(),[creating,setCreating]=useState(false),[settings,setSettings]=useState(false);
 const summary=useQuery({queryKey:['ie-summary',user.id,user.role],queryFn:()=>ieCall('summary'),retry:false});
 const types=useQuery({queryKey:['ie-classifications',user.id],queryFn:()=>ieCall('classifications'),staleTime:60000,retry:false});
 return <div className="space-y-5"><header className="flex flex-wrap items-end justify-between gap-4 rounded-hero bg-als-navy p-6 text-sidebar-foreground sm:p-8"><div><p className="text-xs uppercase tracking-widest text-sidebar-foreground/70">I &amp; E workspace</p><h1 className="mt-2 font-heading text-3xl font-bold">Insights &amp; Engagement</h1><p className="mt-2 max-w-2xl text-sm text-sidebar-foreground/80">Research, planning and engagement work, connected to clients and the places they serve.</p></div><div className="flex flex-wrap gap-2">{['admin','sam_director'].includes(user.role)&&<Button variant="secondary" onClick={()=>setSettings(true)}><Settings2/>Service types</Button>}{IE_EDIT_ROLES.includes(user.role)&&<Button onClick={()=>setCreating(true)}><Plus/>New engagement</Button>}</div></header><Tabs defaultValue="overview"><TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="engagements">Engagements</TabsTrigger></TabsList><TabsContent value="overview" className="space-y-5 pt-3"><IEQueryState query={summary}><IEKpis data={summary.data}/><div className="mt-5 grid items-start gap-5 lg:grid-cols-3"><IEPanel title="My work" description="Open engagements owned by or shared with me."><IEWorkList items={summary.data?.mine} empty="No open engagements assigned to me."/></IEPanel><IEPanel title="Needs attention" description="Outstanding actions and approaching or overdue targets."><IEWorkList items={summary.data?.needs} empty="No engagements currently need attention."/></IEPanel><IEPanel title="Recently updated"><IEWorkList items={summary.data?.recent} activity/></IEPanel></div></IEQueryState></TabsContent><TabsContent value="engagements" className="pt-3"><IERegister classifications={types.data?.items||[]}/></TabsContent></Tabs>{creating&&<IEEngagementForm onClose={()=>setCreating(false)}/>} {settings&&<IEClassificationEditor onClose={()=>setSettings(false)}/>}</div>;
}