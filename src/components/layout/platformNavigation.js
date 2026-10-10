import { House, Users, BriefcaseBusiness, FolderKanban, LayoutDashboard, Receipt, ChartNoAxesCombined } from 'lucide-react';
import { INTERNAL_ROLES } from '@/lib/portal';
const all = [...INTERNAL_ROLES, 'client', 'supplier', 'project_manager'];
export default function platformNavigation(role, approvals) {
  const internal = INTERNAL_ROLES.includes(role), finance = ['admin','finance','director'].includes(role);
  const groups = [
    {label:'Today',to:'/today',icon:House,show:internal || ['client','supplier'].includes(role),match:['/today','/calendar','/pulse','/lookout','/approvals'],links:[['My day','/today'],['Calendar','/calendar'],...(approvals ? [['Approval centre','/approvals']] : []),...(internal ? [['Insider','/pulse']] : [])]},
    {label:'People',to:internal ? '/people' : '/clients',icon:Users,show:all.includes(role) && role !== 'supplier',match:['/people','/contacts','/accounts','/clients','/suppliers'],links:[...(internal ? [['People & relationships','/people']] : []),['Client organisations','/clients'],['Supplier organisations','/suppliers']]},
    {label:'Pipeline',to:'/crm/opportunities',icon:BriefcaseBusiness,show:internal,match:['/crm','/opportunities'],links:[['Opportunities & proposals','/crm/opportunities'],['Pipeline actions','/crm/tasks'],['Interaction history','/crm/activities'],['Lost opportunities','/crm/opportunities/lost']]},
    {label:'Projects',to:'/projects',icon:FolderKanban,show:all.includes(role),match:['/projects','/documents','/warranties'],links:[['Project workspace','/projects'],...(!['supplier','project_manager'].includes(role) ? [['Documents','/documents'],['Warranties','/warranties']] : [])]},
    {label:'Portfolio',to:'/portfolio-overview',icon:LayoutDashboard,show:internal,match:['/portfolio-overview'],links:[]},
    {label:'Commercial',to:'/finance',icon:Receipt,show:finance,match:['/finance'],links:[]},
    {label:'Insights',to:'/framework-reports',icon:ChartNoAxesCombined,show:internal || role === 'framework_stakeholder',match:['/framework-reports'],links:[['Framework reporting','/framework-reports']]},
  ];
  return groups.filter(group=>group.show);
}