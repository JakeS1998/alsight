import React,{useEffect,useState} from 'react';
import {useLocation,useParams,useSearchParams} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import {ieCall} from '@/components/ie/ieClient';
import {Tabs,TabsContent} from '@/components/ui/tabs';
import ProjectStickyHeader from '@/components/projects/ProjectStickyHeader';
import IEEngagementHeader from '@/components/ie/IEEngagementHeader';
import IEEngagementNav from '@/components/ie/IEEngagementNav';
import IEEngagementTimeline from '@/components/ie/IEEngagementTimeline';
import IEWorkingTabs from '@/components/ie/IEWorkingTabs';
import {IE_WORK_TABS} from '@/components/ie/ieWorkConfig';
import '@/components/projects/project-workspace.css';
import '@/components/ie/ie-engagement-workspace.css';
import IEQueryState from '@/components/ie/IEQueryState';
import IEOverview from '@/components/ie/IEOverview';
import IERecentChanges from '@/components/ie/IERecentChanges';
import IEEngagementForm from '@/components/ie/IEEngagementForm';
export default function IEEngagementDetail(){
 const {engagementId}=useParams(),{user}=useAuth(),[editing,setEditing]=useState(false);
 const [search,setSearch]=useSearchParams(),{hash}=useLocation();
 const query=useQuery({queryKey:['ie-detail',engagementId,user.id,user.role],queryFn:()=>ieCall('detail',{id:engagementId}),retry:false});
 const item=query.data?.item;
 const showDocuments=item?.origin!=='project_department'||/^PROJ/i.test(query.data?.project?.project_number||'');
 const activeTab=IE_WORK_TABS.includes(search.get('tab'))&&(search.get('tab')!=='documents'||showDocuments)?search.get('tab'):'overview';
 useEffect(()=>{
  if(!item||!['#ie-awaiting-action','#ie-target-completion'].includes(hash))return;
  const frame=requestAnimationFrame(()=>{const target=document.getElementById(hash.slice(1));target?.focus({preventScroll:true});target?.scrollIntoView({block:'center'});});
  return()=>cancelAnimationFrame(frame);
 },[item?.id,activeTab,hash]);
 const selectTab=tab=>{const next=new URLSearchParams(search);if(tab==='overview')next.delete('tab');else next.set('tab',tab);setSearch(next,{replace:true,preventScrollReset:true});};
 return <IEQueryState query={query}>{item&&<Tabs className="project-workspace ie-engagement-workspace" value={activeTab} onValueChange={selectTab}>
  <main className="ws-main">
   <ProjectStickyHeader className="ws-sticky-header">
    <IEEngagementHeader item={item} canEdit={query.data.canEdit} onEdit={()=>setEditing(true)}/>
    <IEEngagementNav showDocuments={showDocuments}/>
   </ProjectStickyHeader>
   <TabsContent value="overview" className="ws-content"><IEOverview data={query.data} onEdit={()=>setEditing(true)}/></TabsContent>
   <TabsContent id="ie-target-completion" tabIndex={-1} value="timeline" className="ws-content"><IEEngagementTimeline item={item}/></TabsContent>
   <IEWorkingTabs engagement={item} canEdit={query.data.canEdit} project={query.data.project} showDocuments={showDocuments}/>
   <TabsContent value="activity" className="ws-content"><IERecentChanges events={query.data.events}/></TabsContent>
  </main>
  {editing&&<IEEngagementForm item={item} onClose={()=>setEditing(false)}/>}
 </Tabs>}</IEQueryState>;
}