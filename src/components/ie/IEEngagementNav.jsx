import React from 'react';
import {Activity,CalendarDays,LayoutDashboard,Search,Users,Palette,FolderOpen,PoundSterling,Scale} from 'lucide-react';
import {TabsList} from '@/components/ui/tabs';
import TabsTrigger from '@/components/navigation/SlidingTabTrigger';
import SlidingTabHighlight from '@/components/navigation/SlidingTabHighlight';

export default function IEEngagementNav({showDocuments=true,showLegal=false}){
 return <nav aria-label="Engagement menu" className="min-w-0"><TabsList className="ws-project-tabs sliding-tab-list" aria-label="Engagement navigation">
  <SlidingTabHighlight/>
  <TabsTrigger className="ws-navitem" value="overview"><LayoutDashboard/>Overview</TabsTrigger>
  <TabsTrigger className="ws-navitem" value="timeline"><CalendarDays/>Timeline</TabsTrigger>
  <TabsTrigger className="ws-navitem" value="research"><Search/>Research &amp; Insights</TabsTrigger>
  <TabsTrigger className="ws-navitem" value="consultation"><Users/>Engagement &amp; Consultation</TabsTrigger>
  <TabsTrigger className="ws-navitem" value="creative"><Palette/>Creative &amp; Marketing</TabsTrigger>
  {showLegal&&<TabsTrigger className="ws-navitem" value="legal"><Scale/>Legal</TabsTrigger>}
  {showDocuments&&<TabsTrigger className="ws-navitem" value="documents"><FolderOpen/>Documents</TabsTrigger>}
  <TabsTrigger className="ws-navitem" value="finance"><PoundSterling/>Finance</TabsTrigger>
  <TabsTrigger className="ws-navitem" value="activity"><Activity/>Activity</TabsTrigger>
 </TabsList></nav>;
}