import { useCallback, useEffect, useRef, useState } from 'react';
import calendarRequest from '@/components/outlook/calendarClient';
import { weekRange } from '@/components/outlook/calendarDates';
export default function useCalendarEvents(connected, week, connectionRefresh) {
  const [events, setEvents] = useState([]), [cursor, setCursor] = useState(null), [loading, setLoading] = useState(false), [error, setError] = useState(''), [selected, setSelected] = useState(null);
  const version = useRef(0);
  const fetchEvents = useCallback(async (next = null) => {
    const request = ++version.current;
    if (!connected) { setEvents([]); setCursor(null); setSelected(null); setError(''); return; }
    setLoading(true); setError('');
    try {
      const data = await calendarRequest('list', { ...weekRange(week), ...(next ? { cursor: next } : {}) });
      if (version.current === request) { setEvents(previous => next ? [...previous, ...data.events] : data.events); setCursor(data.next_cursor); }
    } catch (err) {
      if (version.current === request) { setError(err.message); if (err.code === 'OUTLOOK_NOT_CONNECTED') { setEvents([]); setSelected(null); connectionRefresh(); } }
    } finally { if (version.current === request) setLoading(false); }
  }, [connected, week, connectionRefresh]);
  useEffect(() => { setEvents([]); setCursor(null); setSelected(null); fetchEvents(); return () => { version.current++; }; }, [fetchEvents]);
  const edit = async event => {
    setLoading(true); setError('');
    try { const data = await calendarRequest('get', { id: event.id }); setSelected(data.event); }
    catch (err) { setError(err.message); if (err.code === 'OUTLOOK_NOT_CONNECTED') connectionRefresh(); }
    finally { setLoading(false); }
  };
  return { events, cursor, loading, error, selected, setSelected, edit, refresh: () => fetchEvents(), loadMore: () => fetchEvents(cursor) };
}