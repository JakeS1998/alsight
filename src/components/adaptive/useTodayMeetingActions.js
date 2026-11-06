import { useEffect } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TASK_SOURCES, assignedTaskQuery, taskRow } from '@/components/tasks/assignedTaskQueries';
const source = TASK_SOURCES[0];
export default function useTodayMeetingActions(user) {
  const cache = useQueryClient();
  const scope = JSON.stringify([user.id, user.role, user.email, user.full_name, user.staff_aad_id, user.data]);
  const identity = useQuery({ queryKey: ['today-meeting-owner', scope], staleTime: 300000, queryFn: async () => (await base44.entities.Contact.filter({ $or: [{ aad_id: user.id }, ...(user.email ? [{ email: user.email }] : [])] }, { limit: 20, fields: ['full_name', 'aad_id'] })).items });
  const filter = assignedTaskQuery(source, user, identity.data || [], null);
  const list = useInfiniteQuery({ queryKey: ['assigned-tasks', 'today-meetings', scope], enabled: identity.isSuccess, initialPageParam: null, staleTime: 60000, queryFn: async ({ pageParam }) => {
    const page = await base44.entities.ProjectAction.filter(filter, { sort: 'due_date', limit: 20, ...(pageParam ? { cursor: pageParam } : {}) });
    const ids = [...new Set(page.items.map(row => row.project_id).filter(Boolean))];
    const projects = ids.length ? await base44.entities.Project.filter({ id: { $in: ids } }, { limit: 20, fields: ['name'] }) : { items: [] };
    const names = Object.fromEntries(projects.items.map(project => [project.id, project.name]));
    return { ...page, items: page.items.map(row => ({ ...taskRow(source, row), projectName: names[row.project_id] })) };
  }, getNextPageParam: page => page.has_more ? page.next_cursor : undefined });
  const total = useQuery({ queryKey: ['assigned-tasks', 'today-meetings', scope, 'count'], enabled: identity.isSuccess, staleTime: 60000, queryFn: () => base44.entities.ProjectAction.count(filter) });
  useEffect(() => {
    const refresh = () => cache.invalidateQueries({ queryKey: ['assigned-tasks', 'today-meetings', scope] });
    const stop = base44.entities.ProjectAction.subscribe(refresh);
    window.addEventListener('alsight-tasks-changed', refresh);
    return () => { stop(); window.removeEventListener('alsight-tasks-changed', refresh); };
  }, [cache, scope]);
  return { rows: list.data?.pages.flatMap(page => page.items) || [], total: total.data, loading: identity.isPending || (identity.isSuccess && list.isPending), error: identity.error || list.error || total.error, more: list.hasNextPage, loadingMore: list.isFetchingNextPage, loadMore: list.fetchNextPage, retry: () => { identity.refetch(); list.refetch(); total.refetch(); } };
}