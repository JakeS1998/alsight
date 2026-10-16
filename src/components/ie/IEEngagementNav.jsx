import React from 'react';
import {Activity,CalendarDays,LayoutDashboard} from 'lucide-react';
import {TabsList,TabsTrigger} from '@/components/ui/tabs';

export default function IEEngagementNav(){
 return <nav aria-label="Engagement menu" className="min-w-0"><TabsList className="ws-project-tabs" aria-label="Engagement navigation">
  <TabsTrigger className="ws-navitem" value="overview"><LayoutDashboard/>Overview</TabsTrigger>
  <TabsTrigger className="ws-navitem" value="timeline"><CalendarDays/>Timeline</TabsTrigger>
  <TabsTrigger className="ws-navitem" value="activity"><Activity/>Activity</TabsTrigger>
 </TabsList></nav>;
}