import { useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import calendarRequest from '@/components/outlook/calendarClient';
import { plannerDay, plannerDayEnd, plannerTime } from '@/components/dashboard/plannerDates';

export default function useTodayOutlookAgenda(user) {
  const [day, setDay] = useState(plannerDay);
  useEffect(() => {
    const refreshDay = () => setDay(plannerDay());
    window.addEventListener('focus', refreshDay);
    return () => window.removeEventListener('focus', refreshDay);
  }, []);
  const noon = Date.parse(`${day}T12:00:00Z`);
  const start = new Date(Date.parse(plannerDayEnd(noon - 86400000)) + 1).toISOString();
  const end = new Date(Date.parse(plannerDayEnd(noon)) + 1).toISOString();
  const query = useInfiniteQuery({
    queryKey: ['today-outlook-agenda', user?.id, day],
    enabled: !!user?.id,
    initialPageParam: null,
    queryFn: ({ pageParam }) => calendarRequest('list', { start, end, timeZone: 'UTC', ...(pageParam ? { cursor: pageParam } : {}) }),
    getNextPageParam: page => page.next_cursor || undefined,
    retry: false,
    refetchOnWindowFocus: true,
  });
  const utc = value => /(?:Z|[+-]\d{2}:\d{2})$/i.test(value || '') ? value : `${value}Z`;
  const rows = (query.data?.pages || []).flatMap(page => page.events).map(event => {
    const time = event.isAllDay ? 'All day' : plannerTime(utc(event.start?.dateTime));
    const finish = plannerTime(utc(event.end?.dateTime));
    return { key: `outlook-${event.id}`, kind: 'calendar', title: event.subject || 'Untitled event', time,
      sort: `${event.isAllDay ? day : plannerDay(utc(event.start?.dateTime))}T${event.isAllDay ? '00:00' : time}`,
      detail: [event.isAllDay ? 'All day' : `${time}–${finish}`, event.location?.displayName, event.isOnlineMeeting ? 'Online meeting' : ''].filter(Boolean).join(' · '),
      href: event.webLink,
      joinUrl: event.isOnlineMeeting && event.onlineMeetingProvider === 'teamsForBusiness' && /^https:\/\//i.test(event.onlineMeeting?.joinUrl || '') ? event.onlineMeeting.joinUrl : null };
  });
  return { rows, loading: query.isPending, error: query.error, more: query.hasNextPage,
    loadingMore: query.isFetchingNextPage, loadMore: query.fetchNextPage, refresh: query.refetch };
}