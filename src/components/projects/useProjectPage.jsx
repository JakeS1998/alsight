import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import projectScope from '@/components/projects/projectScope';
import { escapeSearch } from '@/components/search/searchSources';

const sorts = { name_asc: 'name', name_desc: '-name', number: 'project_number', value_desc: '-estimated_value', value_asc: 'estimated_value', newest: '-created_date' };
export default function useProjectPage(user, filters, cursor, enabled, refreshKey) {
  const staff = useQuery({ queryKey: ['project-staff-id', user?.id], enabled: enabled && ['bdm', 'bsm'].includes(user?.role), queryFn: async () => {
    if (!user?.email) return null;
    const page = await base44.entities.Contact.filter({ email: { $regex: `^${escapeSearch(user.email)}$`, $options: 'i' } }, { limit: 1, fields: ['aad_id'] });
    return page.items[0]?.aad_id || null;
  }, staleTime: 300000 });
  const base = useMemo(() => ({ $and: [{ status: { $ne: 'inactive' } }, projectScope(user, staff.data)] }), [user, staff.data]);
  const query = useMemo(() => {
    const conditions = [...base.$and];
    if (filters.search.trim()) conditions.push({ $or: ['name', 'project_number', 'client_name'].map(field => ({ [field]: { $regex: escapeSearch(filters.search.trim()), $options: 'i' } })) });
    if (filters.bdm) conditions.push({ bdm_aad_id: filters.bdm });
    if (filters.bsm) conditions.push({ bsm_aad_id: filters.bsm });
    if (filters.region) conditions.push({ department_id: filters.region });
    if (filters.status) conditions.push({ live_project: filters.status === 'live' });
    return { $and: conditions };
  }, [base, filters.search, filters.bdm, filters.bsm, filters.region, filters.status]);
  const ready = enabled && !staff.isLoading && !staff.error;
  const page = useQuery({ queryKey: ['project-page', user?.id, query, filters.sort, cursor, refreshKey], enabled: ready, queryFn: () => base44.entities.Project.filter(query, { sort: sorts[filters.sort] || '-created_date', limit: 50, ...(cursor ? { cursor } : {}) }) });
  const counts = useQuery({ queryKey: ['project-counts', user?.id, query, refreshKey], enabled: ready, queryFn: async () => { const [matching, total] = await Promise.all([base44.entities.Project.count(query), base44.entities.Project.count(base)]); return { matching, total }; } });
  const options = useQuery({ queryKey: ['project-filter-options', user?.id, base, refreshKey], enabled: ready, queryFn: async () => {
    const pages = await Promise.all(['bdm_aad_id', 'bsm_aad_id', 'department_id'].map(distinct => base44.entities.Project.filter(base, { distinct, limit: 1000 })));
    return { bdm: pages[0].items.filter(Boolean), bsm: pages[1].items.filter(Boolean), region: pages[2].items.filter(Boolean) };
  }, staleTime: 300000 });
  return { items: page.data?.items || [], next: page.data?.has_more ? page.data.next_cursor : null, counts: counts.data, options: options.data, loading: enabled && (staff.isLoading || page.isLoading || counts.isLoading), error: staff.error || page.error || counts.error || options.error };
}