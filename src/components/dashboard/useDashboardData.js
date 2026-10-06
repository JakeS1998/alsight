import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { filterAll } from '@/components/data/loadAll';
import useDashboardDirectory from '@/components/dashboard/useDashboardDirectory';
import { INTERNAL_ROLES } from '@/lib/portal';
import projectScope from '@/components/projects/projectScope';
import usePortfolioExtras from '@/components/dashboard/usePortfolioExtras';
import { buildPortfolio } from '@/components/dashboard/portfolioMetrics';
export default function useDashboardData(filters = {}) {
  const { user } = useAuth();
  const [revision, setRevision] = useState(0);
  const role = user?.role || 'client';
  const internal = INTERNAL_ROLES.includes(role);
  const scopeKey = JSON.stringify([user?.id, role, user?.staff_aad_id, user?.data, user?.region, user?.delegate_of, revision]);
  const key = JSON.stringify([scopeKey, filters]);
  const directory = useDashboardDirectory(user, scopeKey);
  const query = useQuery({ queryKey: ['dashboard-data', key], enabled: !!user?.id && role !== 'project_manager' && directory.identityReady, staleTime: 60000, refetchOnMount: false, queryFn: async () => {
    const clauses = [{ status: { $ne: 'inactive' } }, projectScope(user, directory.contact?.aad_id)];
    if (filters.region) clauses.push({ department_id: filters.region });
    if (filters.bdm) clauses.push({ bdm_aad_id: filters.bdm });
    if (filters.status) clauses.push({ live_project: filters.status === 'live' });
    if (filters.period) { const year = new Date().getFullYear() - (new Date().getMonth() < 3 ? 1 : 0) - (filters.period === 'previous' ? 1 : 0); clauses.push({ created_date: { $gte: `${year}-04-01`, $lt: `${year + 1}-04-01` } }); }
    const projects = role === 'supplier' ? await base44.functions.invoke('supplierProjectAccess', { action: 'projects' }).then(r => r.data.projects || []) : await filterAll(base44.entities.Project, { $and: clauses }, '-updated_date');
    return { projects };
  } });
  const extras = usePortfolioExtras(!!user && internal, scopeKey);
  const projects = query.data?.projects || [];
  const portfolio = useMemo(() => buildPortfolio(projects, extras.data), [query.data, extras.data]);
  const accountMap = useMemo(() => Object.fromEntries(directory.accounts.filter(a => a.dataverse_id).map(a => [a.dataverse_id, a])), [directory.accounts]);
  return { user, role, internal, projects, portfolio, accountMap, extras: extras.data, projectsLoading: query.isPending, loading: query.isPending || directory.loading || (internal && extras.loading), error: query.error?.message || directory.error || extras.error, refresh: () => setRevision(v => v + 1), key, scopeKey };
}