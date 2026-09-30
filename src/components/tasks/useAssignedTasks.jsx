import { useEffect, useState } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TASK_SOURCES, assignedTaskQuery, taskRow } from '@/components/tasks/assignedTaskQueries';
export default function useAssignedTasks(user, dueOnly = false) {
  const client = useQueryClient();
  const [now, setNow] = useState(Date.now());
  const scope = JSON.stringify([user?.id, user?.role, user?.full_name, user?.account_id, user?.region, user?.staff_aad_id, user?.delegate_of, user?.delegate_region, user?.company_number, user?.data]);
  const identity = useQuery({ queryKey: ['task-owner', scope], enabled: !!user?.id, queryFn: async () => {
    const alternatives = [{ aad_id: user.id }, ...(user.email ? [{ email: user.email }] : [])];
    return (await base44.entities.Contact.filter({ $or: alternatives }, { limit: 20, fields: ['full_name', 'aad_id'] })).items;
  } });
  const horizon = dueOnly ? new Date(now + 48 * 3600000).toISOString() : null;
  const key = ['assigned-tasks', scope, dueOnly, horizon];
  const queries = TASK_SOURCES.map(s => assignedTaskQuery(s, user || {}, identity.data || [], horizon));
  const enabled = !!user?.id && identity.isSuccess;
  const list = useInfiniteQuery({ queryKey: [...key, 'list'], enabled, initialPageParam: {}, queryFn: async ({ pageParam }) => {
    const pages = await Promise.all(TASK_SOURCES.map((s, i) => pageParam[s.entity] === false ? { items: [], has_more: false } : base44.entities[s.entity].filter(queries[i], { sort: s.due, limit: 20, ...(pageParam[s.entity] ? { cursor: pageParam[s.entity] } : {}) })));
    return { rows: pages.flatMap((p, i) => p.items.map(r => taskRow(TASK_SOURCES[i], r))), cursors: Object.fromEntries(pages.map((p, i) => [TASK_SOURCES[i].entity, p.has_more ? p.next_cursor : false])) };
  }, getNextPageParam: page => Object.values(page.cursors).some(Boolean) ? page.cursors : undefined });
  const total = useQuery({ queryKey: [...key, 'count'], enabled, queryFn: async () => (await Promise.all(TASK_SOURCES.map((s, i) => base44.entities[s.entity].count(queries[i])))).reduce((a, b) => a + b, 0) });
  useEffect(() => {
    if (!user?.id) return;
    const refresh = () => client.invalidateQueries({ queryKey: ['assigned-tasks', scope] });
    const timer = setInterval(() => { if (dueOnly) setNow(Date.now()); else refresh(); }, 60000);
    const stops = TASK_SOURCES.map(s => base44.entities[s.entity].subscribe(refresh));
    window.addEventListener('alsight-tasks-changed', refresh);
    return () => { clearInterval(timer); stops.forEach(stop => stop()); window.removeEventListener('alsight-tasks-changed', refresh); };
  }, [scope, dueOnly, client, user?.id]);
  return { rows: (list.data?.pages.flatMap(p => p.rows) || []).sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999')), total: total.data || 0, loading: !!user?.id && (identity.isPending || (enabled && list.isPending)), error: identity.error || list.error || total.error, more: list.hasNextPage, loadingMore: list.isFetchingNextPage, loadMore: list.fetchNextPage };
}