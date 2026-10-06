import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import organisationQueryPolicy from '@/components/data/organisationQueryPolicy';
export default function useOverviewAnalytics(dashboard, since) {
  const ids = dashboard.portfolio.pipeline.map(p => p.id);
  const enabled = !dashboard.projectsLoading && !dashboard.error && !!dashboard.user && dashboard.internal;
  const summary = useQuery({ ...organisationQueryPolicy, queryKey: ['overview-analytics', dashboard.key], enabled, staleTime: 60000, refetchOnMount: false, queryFn: async () => {
    const { data } = await base44.functions.invoke('getPortfolioOverview', { projectIds: ids });
    if (data.error) throw new Error(data.error);
    return data;
  } });
  const needsRecent = since !== undefined;
  const recent = useQuery({ ...organisationQueryPolicy, queryKey: ['overview-recent', dashboard.key, since], enabled: enabled && needsRecent, staleTime: 60000, queryFn: async () => {
    const query = { id: { $in: ids.length ? ids : ['000000000000000000000000'] } };
    if (typeof since === 'string' && !isNaN(Date.parse(since))) query.updated_date = { $gt: since };
    const page = await base44.entities.Project.filter(query, { sort: '-updated_date', limit: 4, fields: ['name', 'updated_date'] });
    return page.items;
  } });
  return { ...summary, data: summary.data && (!needsRecent || recent.data) ? { ...summary.data, recent: needsRecent ? recent.data : summary.data.recent } : undefined, error: summary.error || recent.error, isFetching: summary.isFetching || recent.isFetching };
}