import { House, LayoutDashboard, ChartNoAxesCombined, FolderKanban } from 'lucide-react';
import InsightsEngagementIcon from '@/components/InsightsEngagementIcon';

export default function mobileNavigationItems(role) {
  const items = [
    { label: 'Today', path: '/today', icon: House },
    { label: 'Alliance360', path: '/alliance360', icon: LayoutDashboard },
    { label: 'Commercial', path: '/commercial', icon: ChartNoAxesCombined },
  ];
  if (['sam', 'sam_director'].includes(role)) items.push({ label: 'Insights & Engagement', path: '/insights-engagement', icon: InsightsEngagementIcon });
  if (['admin', 'bdm', 'bsm', 'director', 'regional_director', 'sam_director'].includes(role)) items.push({ label: 'Projects', path: '/projects', icon: FolderKanban });
  return items;
}