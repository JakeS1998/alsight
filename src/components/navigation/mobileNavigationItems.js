import { House, LayoutDashboard, ChartNoAxesCombined, FolderKanban } from 'lucide-react';
import InsightsEngagementIcon from '@/components/InsightsEngagementIcon';
import {canViewWorkspace,workspaceForPath} from '@/components/navigation/workspaceAccess';

export default function mobileNavigationItems(user) {
  const role=typeof user==='string'?user:user?.role;
  const items = [
    { label: 'Today', path: '/today', icon: House },
    { label: 'Alliance360', path: '/alliance360', icon: LayoutDashboard },
    { label: 'Commercial', path: '/commercial', icon: ChartNoAxesCombined },
  ];
  if (['sam', 'sam_director'].includes(role)) items.push({ label: 'Insights & Engagement', path: '/insights-engagement', icon: InsightsEngagementIcon });
  if (['admin', 'bdm', 'bsm', 'director', 'regional_director', 'sam_director'].includes(role)) items.push({ label: 'Projects', path: '/projects', icon: FolderKanban });
  return items.filter(item=>canViewWorkspace(user,workspaceForPath(item.path)));
}