import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
export default function useOverviewAnalytics(dashboard, since) {
  const ids = dashboard.portfolio.pipeline.map(p => p.id);
  return useQuery({ queryKey: ['overview-analytics', dashboard.key, since], enabled: !dashboard.loading && !dashboard.error && !!dashboard.user && dashboard.internal, staleTime: 60000, queryFn: async () => {
    const { data } = await base44.functions.invoke('getPortfolioOverview', { projectIds: ids, since });
    if (data.error) throw new Error(data.error);
    return data;
  } });
}