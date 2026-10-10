import { useEffect, useState } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TASK_SOURCES, assignedTaskQuery, taskRow } from '@/components/tasks/assignedTaskQueries';
import organisationQueryPolicy from '@/components/data/organisationQueryPolicy';
import { plannerDayEnd } from '@/components/dashboard/plannerDates';
export default function useAssignedTasks(user, dueOnly = false, loadRows = true) {
  const client = useQueryClient();
  const [now, setNow] = useState(() => Math.floor(Date.now() / 60000) * 60000);
  const scope = JSON.stringify([user?.id, user?.role, user?.full_name, user?.account_id, user?.region, user?.staff_aad_id, user?.delegate_of, user?.delegate_region, user?.company_number, user?.data]);
  const identity = useQuery({ queryKey: ['task-owner', scope], enabled: !!user?.id, ...organisationQueryPolicy, staleTime: 300000, queryFn: async () => {
    const alternatives = [{ aad_id: user.id }, ...(user.email ? [{ email: user.email }] : [])];
    return (await base44.entities.Contact.filter({ $or: alternatives }, { limit: 20, fields: ['full_name', 'aad_id'] })).items;
  } });
  const horizon = dueOnly === 'today' ? plannerDayEnd(now) : dueOnly ? new Date(now + 48 * 3600000).toISOString() : null;
  const key = ['assigned-tasks', scope, dueOnly, horizon];
  const queries = TASK_SOURCES.map(s => assignedTaskQuery(s, user || {}, identity.data || [], horizon));
  const enabled = !!user?.id && identity.isSuccess;
  const listEnabled = enabled && loadRows;
  const list = useInfiniteQuery({ queryKey: [...key, 'list'], enabled: listEnabled, ...organisationQueryPolicy, initialPageParam: {}, queryFn: async ({ pageParam }) => {
    const pages = [];
    for (const [i, s] of TASK_SOURCES.entries()) pages.push(pageParam[s.entity] === false ? { items: [], has_more: false } : await base44.entities[s.entity].filter(queries[i], { sort: s.due, limit: 20, ...(pageParam[s.entity] ? { cursor: pageParam[s.entity] } : {}) }));
    return { rows: pages.flatMap((p, i) => p.items.map(r => taskRow(TASK_SOURCES[i], r))), cursors: Object.fromEntries(pages.map((p, i) => [TASK_SOURCES[i].entity, p.has_more ? p.next_cursor : false])) };
  }, getNextPageParam: page => Object.values(page.cursors).some(Boolean) ? page.cursors : undefined });
  const total = useQuery({ queryKey: [...key, 'count'], enabled, ...organisationQueryPolicy, queryFn: async () => {
    let count = 0;
    for (const [i, source] of TASK_SOURCES.entries()) count += await base44.entities[source.entity].count(queries[i]);
    return count;
  } });
  useEffect(() => {
    if (!user?.id) return;
    let refreshTimer;
    const refresh = () => { clearTimeout(refreshTimer); refreshTimer = setTimeout(() => client.invalidateQueries({ queryKey: ['assigned-tasks', scope] }), 500); };
    const timer = setInterval(() => { if (dueOnly) setNow(Math.floor(Date.now() / 60000) * 60000); else refresh(); }, 60000);
    const stops = TASK_SOURCES.map(s => base44.entities[s.entity].subscribe(refresh));
    window.addEventListener('alsight-tasks-changed', refresh);
    return () => { clearInterval(timer); clearTimeout(refreshTimer); stops.forEach(stop => stop()); window.removeEventListener('alsight-tasks-changed', refresh); };
  }, [scope, dueOnly, client, user?.id]);
  return { rows: (list.data?.pages.flatMap(p => p.rows) || []).sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999')), total: total.data || 0, loading: !!user?.id && (identity.isPending || (listEnabled && list.isPending)), error: identity.error || list.error || total.error, more: list.hasNextPage, loadingMore: list.isFetchingNextPage, loadMore: list.fetchNextPage };
}