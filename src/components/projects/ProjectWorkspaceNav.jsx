import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { INTERNAL_ROLES } from '@/lib/portal';
import UKLFIcon from '@/components/framework/UKLFIcon';
import { FileText, ShieldCheck, LayoutDashboard, Receipt, Calendar, ClipboardList, ListChecks } from 'lucide-react';

export default function ProjectWorkspaceNav({ user, project, isSupplier, isExternalPM, canSeeValuations }) {
  return <nav className="min-w-0" aria-label="Project menu">
    <TabsList className="ws-project-tabs" aria-label="Project navigation">
      <TabsTrigger className="ws-navitem" value="general"><LayoutDashboard />{isSupplier || isExternalPM ? 'Project details' : 'General'}</TabsTrigger>
      <TabsTrigger className="ws-navitem" value="timeline"><Calendar />Timeline</TabsTrigger>
      <TabsTrigger className="ws-navitem" value="drafting"><FileText />Documents</TabsTrigger>
      <TabsTrigger className="ws-navitem" value="warranties"><ShieldCheck />Warranties</TabsTrigger>
      {isSupplier && <TabsTrigger className="ws-navitem" value="purchase-orders"><Receipt />Purchase orders</TabsTrigger>}
      {!isExternalPM && !isSupplier && <TabsTrigger className="ws-navitem" value="finance"><Receipt />Finance</TabsTrigger>}
      {!isSupplier && <TabsTrigger className="ws-navitem" value="delivery"><ClipboardList />Pathway</TabsTrigger>}
      {canSeeValuations && <TabsTrigger className="ws-navitem" value="valuations"><ListChecks />Valuations</TabsTrigger>}
      {INTERNAL_ROLES.includes(user?.role) && project.procurement_route !== false && <TabsTrigger className="ws-navitem" value="uklf"><UKLFIcon />UKLF</TabsTrigger>}
    </TabsList>
  </nav>;
}