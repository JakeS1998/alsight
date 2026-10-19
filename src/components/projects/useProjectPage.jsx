import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import projectScope from '@/components/projects/projectScope';
import { escapeSearch } from '@/components/search/searchSources';
import projectFilterValues from '@/components/projects/projectFilterValues';
import { IE_DEPARTMENT_IDS } from '@/components/ie/ieProjectDepartment';

const sorts = { name_asc: 'name', name_desc: '-name', number: 'project_number', value_desc: '-full_value', value_asc: 'full_value', newest: '-created_date' };
export default function useProjectPage(user, filters, cursor, enabled, refreshKey) {
  const staff = useQuery({ queryKey: ['project-staff-id', user?.id, user?.role, user?.email], enabled: enabled && ['bdm', 'bsm'].includes(user?.role), queryFn: async () => {
    if (!user?.email) return null;
    const page = await base44.entities.Contact.filter({ email: { $regex: `^${escapeSearch(user.email)}$`, $options: 'i' } }, { limit: 1, fields: ['aad_id'] });
    return page.items[0]?.aad_id || null;
  }, staleTime: 300000 });
  const base = useMemo(() => ({ $and: [{ status: { $ne: 'inactive' }, department_id: { $nin: IE_DEPARTMENT_IDS } }, projectScope(user, staff.data)] }), [user, staff.data]);
  const query = useMemo(() => {
    const conditions = [...base.$and];
    if (filters.search.trim()) conditions.push({ $or: ['name', 'project_number', 'client_name'].map(field => ({ [field]: { $regex: escapeSearch(filters.search.trim()), $options: 'i' } })) });
    for (const [key,field] of [['bdm','bdm_aad_id'],['bsm','bsm_aad_id'],['region','department_id'],['pm','project_manager_id'],['client','client_account_id']]) {
      const values=projectFilterValues(filters[key]);
      if(values.length)conditions.push({[field]:{$in:values}});
    }
    const statuses=projectFilterValues(filters.status);
    if(statuses.length)conditions.push({live_project:{$in:statuses.map(status=>status==='live')}});
    if (filters.scope==='mine') {const ids=[user?.id,user?.staff_aad_id,user?.data?.staff_aad_id,user?.delegate_of,staff.data].filter(Boolean);conditions.push({$or:['bdm_aad_id','bsm_aad_id','project_manager_id'].map(field=>({[field]:{$in:ids}}))});}
    return { $and: conditions };
  }, [base, filters.search, filters.bdm, filters.bsm, filters.region, filters.status,filters.pm,filters.client,filters.scope,user,staff.data]);
  const scopeReady = enabled && !staff.isLoading && !staff.error;
  const selectedRatings=useMemo(()=>projectFilterValues(filters.ase),[filters.ase]);
  const hasRatings=selectedRatings.length>0;
  const ratings = useQuery({queryKey:['project-ase-filter',user?.id,user?.role,query,refreshKey],enabled:scopeReady && hasRatings,staleTime:60000,retry:false,queryFn:async()=>{const {data}=await base44.functions.invoke('getProjectASERatings',{query});if(data.error)throw new Error(data.error);return data;}});
  const ratingError=hasRatings ? ratings.error : null;
  const filteredQuery=useMemo(()=>hasRatings ? {...query,id:{$in:[...new Set(selectedRatings.flatMap(value=>ratings.data?.buckets?.[value] || []))]}} : query,[query,hasRatings,selectedRatings,ratings.data]);
  const ready = scopeReady && (!hasRatings || !ratings.isPending && !ratingError);
  const page = useQuery({ queryKey: ['project-page', user?.id, user?.role, filteredQuery, filters.sort, cursor, refreshKey], enabled: ready, queryFn: () => base44.entities.Project.filter(filteredQuery, { sort: sorts[filters.sort] || '-created_date', limit: 50, ...(cursor ? { cursor } : {}) }) });
  const counts = useQuery({ queryKey: ['project-counts', user?.id, user?.role, filteredQuery, refreshKey], enabled: ready, queryFn: async () => { const [matching, total] = await Promise.all([base44.entities.Project.count(filteredQuery), base44.entities.Project.count(base)]); return { matching, total }; } });
  const options = useQuery({ queryKey: ['project-filter-options', user?.id, user?.role, base, refreshKey], enabled: ready, queryFn: async () => {
    const pages = await Promise.all(['bdm_aad_id', 'bsm_aad_id', 'department_id', 'project_manager_id', 'client_account_id'].map(distinct => base44.entities.Project.filter(base, { distinct, limit: 1000 })));
    return { bdm: pages[0].items.filter(Boolean), bsm: pages[1].items.filter(Boolean), region: pages[2].items.filter(Boolean),pm:pages[3].items.filter(Boolean),client:pages[4].items.filter(Boolean) };
  }, staleTime: 300000 });
  return { items: ready ? page.data?.items || [] : [], next: ready && page.data?.has_more ? page.data.next_cursor : null, counts: counts.data, options: options.data, loading: enabled && (staff.isLoading || hasRatings && ratings.isPending || page.isLoading || counts.isLoading), error: staff.error || ratingError || page.error || counts.error || options.error, mapQuery: filteredQuery, mapSort: sorts[filters.sort] || '-created_date', mapReady: ready, scopeError: staff.error || ratingError, retryScope: ratingError ? ratings.refetch : staff.refetch };
}