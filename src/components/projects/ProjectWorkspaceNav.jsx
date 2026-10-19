import React from 'react';
import { TabsList } from '@/components/ui/tabs';
import TabsTrigger from '@/components/navigation/SlidingTabTrigger';
import SlidingTabHighlight from '@/components/navigation/SlidingTabHighlight';
import { INTERNAL_ROLES } from '@/lib/portal';
import UKLFIcon from '@/components/framework/UKLFIcon';
import { FileText, ShieldCheck, LayoutDashboard, Receipt, Calendar, ClipboardList, ListChecks, FileQuestion } from 'lucide-react';

export default function ProjectWorkspaceNav({ user, project, isSupplier, isExternalPM, canSeeValuations, children }) {
  return <nav className="min-w-0" aria-label="Project menu">
    <TabsList className="ws-project-tabs sliding-tab-list" aria-label="Project navigation">
      <SlidingTabHighlight/>
      <TabsTrigger className="ws-navitem" value="general"><LayoutDashboard />Overview</TabsTrigger>
      <TabsTrigger className="ws-navitem" value="timeline"><Calendar />Timeline</TabsTrigger>
      {INTERNAL_ROLES.includes(user?.role) && <TabsTrigger className="ws-navitem" value="questionnaire"><FileQuestion />PQ</TabsTrigger>}
      <TabsTrigger className="ws-navitem" value="drafting"><FileText />Documents</TabsTrigger>
      {!isSupplier && <TabsTrigger className="ws-navitem" value="delivery"><ClipboardList />Pathway</TabsTrigger>}
      {!isExternalPM && !isSupplier && <TabsTrigger className="ws-navitem" value="finance"><Receipt />Finance</TabsTrigger>}
      {isSupplier && <TabsTrigger className="ws-navitem" value="purchase-orders"><Receipt />Purchase orders</TabsTrigger>}
      {canSeeValuations && <TabsTrigger className="ws-navitem" value="valuations"><ListChecks />Valuations</TabsTrigger>}
      <TabsTrigger className="ws-navitem" value="warranties"><ShieldCheck />Warranties</TabsTrigger>
      {INTERNAL_ROLES.includes(user?.role) && project.procurement_route !== false && <TabsTrigger className="ws-navitem" value="uklf"><UKLFIcon />UKLF</TabsTrigger>}
      {children}
    </TabsList>
  </nav>;
}