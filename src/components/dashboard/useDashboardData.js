import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { filterAll, listAll } from '@/components/data/loadAll';
import { INTERNAL_ROLES } from '@/lib/portal';
import projectScope from '@/components/projects/projectScope';
import usePortfolioExtras from '@/components/dashboard/usePortfolioExtras';
import { buildPortfolio } from '@/components/dashboard/portfolioMetrics';
export default function useDashboardData(filters = {}) {
  const { user } = useAuth();
  const [revision, setRevision] = useState(0);
  const role = user?.role || 'client';
  const internal = INTERNAL_ROLES.includes(role);
  const key = JSON.stringify([user?.id, role, user?.staff_aad_id, user?.data, user?.region, user?.delegate_of, filters, revision]);
  const query = useQuery({ queryKey: ['dashboard-data', key], enabled: !!user?.id && role !== 'project_manager', staleTime: 60000, queryFn: async () => {
    const contact = ['bdm','bsm'].includes(role) && user.email ? (await base44.entities.Contact.filter({ email: { $regex: `^${user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } }, { limit: 1, fields: ['aad_id'] })).items[0] : null;
    const clauses = [{ status: { $ne: 'inactive' } }, projectScope(user, contact?.aad_id)];
    if (filters.region) clauses.push({ department_id: filters.region });
    if (filters.bdm) clauses.push({ bdm_aad_id: filters.bdm });
    if (filters.status) clauses.push({ live_project: filters.status === 'live' });
    if (filters.period) { const year = new Date().getFullYear() - (new Date().getMonth() < 3 ? 1 : 0) - (filters.period === 'previous' ? 1 : 0); clauses.push({ created_date: { $gte: `${year}-04-01`, $lt: `${year + 1}-04-01` } }); }
    const [projects, accounts] = await Promise.all([role === 'supplier' ? base44.functions.invoke('supplierProjectAccess', { action: 'projects' }).then(r => r.data.projects || []) : filterAll(base44.entities.Project, { $and: clauses }, '-updated_date'), listAll(base44.entities.Account, '-name')]);
    return { projects, accounts };
  } });
  const extras = usePortfolioExtras(!!user && internal, key);
  const projects = query.data?.projects || [];
  const portfolio = useMemo(() => buildPortfolio(projects, extras.data), [query.data, extras.data]);
  const accountMap = useMemo(() => Object.fromEntries((query.data?.accounts || []).filter(a => a.dataverse_id).map(a => [a.dataverse_id, a])), [query.data]);
  return { user, role, internal, projects, portfolio, accountMap, extras: extras.data, loading: query.isPending || (internal && extras.loading), error: query.error?.message || extras.error, refresh: () => setRevision(v => v + 1), key };
}