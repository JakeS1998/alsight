import React from 'react';
import {TabsList,TabsTrigger} from '@/components/ui/tabs';
import {INTERNAL_ROLES} from '@/lib/portal';
import {DropdownMenu,DropdownMenuTrigger,DropdownMenuContent,DropdownMenuItem} from '@/components/ui/dropdown-menu';
import {FileText,ShieldCheck,LayoutDashboard,Receipt,Calendar,ClipboardList,ListChecks,Users,History,Gavel,House,AlertTriangle,ChevronDown} from 'lucide-react';
const connected=[['general','Overview',LayoutDashboard],['delivery','Journey',ClipboardList],['activity','Activity',History],['finance','Commercial',Receipt],['risks','Risks',AlertTriangle],['actions','Actions',ListChecks],['decisions','Decisions',Gavel],['drafting','Documents',FileText],['people','People',Users],['handover','Handover',House]];
export default function ProjectWorkspaceNav({user,project,isSupplier,isExternalPM,canSeeValuations,children,onSelectTab,activeTab,approvalAccess}) {
  const internal=INTERNAL_ROLES.includes(user?.role);
  const other=[['timeline','Programme'],['warranties','Warranties'],...(canSeeValuations ? [['valuations','Valuations']] : []),...(project.procurement_route!==false ? [['uklf','UKLF report']] : []),...(approvalAccess ? [['approvals','Approvals']] : [])];
  return <nav className="min-w-0" aria-label="Project menu"><TabsList className="ws-project-tabs" aria-label="Project navigation">
    {internal ? <>{connected.map(([value,label,Icon])=><TabsTrigger key={value} className="ws-navitem" value={value}><Icon/>{label}</TabsTrigger>)}<DropdownMenu><DropdownMenuTrigger className="ws-navitem rounded-md" data-state={other.some(([value])=>value===activeTab) ? 'active' : 'inactive'}>More<ChevronDown/></DropdownMenuTrigger><DropdownMenuContent align="end">{other.map(([value,label])=><DropdownMenuItem key={value} onSelect={()=>onSelectTab(value)}>{label}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu></> : <>
      <TabsTrigger className="ws-navitem" value="general"><LayoutDashboard/>Overview</TabsTrigger><TabsTrigger className="ws-navitem" value="timeline"><Calendar/>Programme</TabsTrigger><TabsTrigger className="ws-navitem" value="drafting"><FileText/>Documents</TabsTrigger>
      {!isSupplier && <TabsTrigger className="ws-navitem" value="delivery"><ClipboardList/>Pathway</TabsTrigger>}{!isSupplier && !isExternalPM && <TabsTrigger className="ws-navitem" value="finance"><Receipt/>Commercial</TabsTrigger>}{isSupplier && <TabsTrigger className="ws-navitem" value="purchase-orders"><Receipt/>Purchase orders</TabsTrigger>}{canSeeValuations && <TabsTrigger className="ws-navitem" value="valuations"><ListChecks/>Valuations</TabsTrigger>}<TabsTrigger className="ws-navitem" value="warranties"><ShieldCheck/>Warranties</TabsTrigger>
    </>}{children}
  </TabsList></nav>;
}