import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import organisationQueryPolicy from '@/components/data/organisationQueryPolicy';

export default function useReminderNotifications(user, open) {
  const cache = useQueryClient();
  const key = ['portal-reminders', user?.id];
  const query = { user_id: user?.id, dismissed_at: { $exists: false } };
  const count = useQuery({
    queryKey: [...key, 'count'], enabled: !!user?.id, ...organisationQueryPolicy,
    staleTime: 60000, refetchInterval: 60000,
    queryFn: () => base44.entities.CRMReminder.count({ ...query, remind_at: { $lte: new Date().toISOString() } }),
  });
  const page = useQuery({
    queryKey: [...key, 'list'], enabled: !!user?.id && open, ...organisationQueryPolicy,
    staleTime: 60000,
    queryFn: () => base44.entities.CRMReminder.filter(query, { sort: 'remind_at', limit: 50 }),
  });
  const refresh = () => cache.invalidateQueries({ queryKey: key });
  useEffect(() => {
    if (!user?.id) return;
    let timer;
    const unsubscribe = base44.entities.CRMReminder.subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(() => cache.invalidateQueries({ queryKey: ['portal-reminders', user.id] }), 500);
    });
    return () => { clearTimeout(timer); unsubscribe(); };
  }, [user?.id, cache]);
  return { rows: page.data?.items || [], due: count.data || 0, loading: open && page.isPending,
    error: page.error?.message || count.error?.message || '', refresh };
}