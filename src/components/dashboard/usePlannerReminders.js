import { useEffect, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import organisationQueryPolicy from '@/components/data/organisationQueryPolicy';
import { plannerDay, plannerDayEnd } from '@/components/dashboard/plannerDates';
export default function usePlannerReminders(user) {
  const cache = useQueryClient(), [now, setNow] = useState(Date.now());
  const key = ['today-planner-reminders', user.id, plannerDay(now)], end = plannerDayEnd(now);
  const query = useInfiniteQuery({ queryKey: key, ...organisationQueryPolicy, initialPageParam: {}, queryFn: async ({ pageParam }) => {
    const pages = {};
    for (const section of ['due', 'future']) {
      pages[section] = pageParam[section] === false ? { items: [], has_more: false } : await base44.entities.CRMReminder.filter({ user_id: user.id, dismissed_at: { $exists: false }, remind_at: section === 'due' ? { $lte: end } : { $gt: end } }, { sort: 'remind_at', limit: 20, ...(pageParam[section] ? { cursor: pageParam[section] } : {}) });
    }
    return { due: pages.due.items, future: pages.future.items, cursors: Object.fromEntries(Object.entries(pages).map(([section, page]) => [section, page.has_more ? page.next_cursor : false])) };
  }, getNextPageParam: page => Object.values(page.cursors).some(Boolean) ? page.cursors : undefined });
  const refresh = async () => { await Promise.all([cache.invalidateQueries({ queryKey: ['today-planner-reminders', user.id] }), cache.invalidateQueries({ queryKey: ['portal-reminders', user.id] })]); };
  useEffect(() => {
    let pending;
    const stop = base44.entities.CRMReminder.subscribe(() => { clearTimeout(pending); pending = setTimeout(() => cache.invalidateQueries({ queryKey: ['today-planner-reminders', user.id] }), 500); });
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => { stop(); clearTimeout(pending); clearInterval(timer); };
  }, [user.id, cache]);
  return { due: query.data?.pages.flatMap(page => page.due) || [], future: query.data?.pages.flatMap(page => page.future) || [], loading: query.isPending, error: query.error, more: query.hasNextPage, loadingMore: query.isFetchingNextPage, loadMore: query.fetchNextPage, refresh };
}