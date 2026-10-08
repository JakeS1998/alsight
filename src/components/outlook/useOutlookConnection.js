import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import calendarRequest, { OUTLOOK_CONNECTOR_ID } from '@/components/outlook/calendarClient';
export default function useOutlookConnection() {
  const [state, setState] = useState({ loading: true, user: null, connected: false, calendar: null, error: '' });
  const timer = useRef(null), popupRef = useRef(null), alive = useRef(true);
  const refresh = useCallback(async () => {
    try {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) { if (alive.current) setState({ loading: false, user: null, connected: false, calendar: null, error: '' }); return; }
      const user = await base44.auth.me();
      if (alive.current) setState(previous => ({ ...previous, user, loading: true, error: '' }));
      try {
        const data = await calendarRequest('status');
        if (alive.current) setState({ loading: false, user, connected: true, calendar: data.calendar, error: '' });
      } catch (error) {
        if (alive.current) setState({ loading: false, user, connected: false, calendar: null, error: error.code === 'OUTLOOK_NOT_CONNECTED' ? '' : error.message });
      }
    } catch (error) { if (alive.current) setState(previous => ({ ...previous, loading: false, error: error.message })); }
  }, []);
  useEffect(() => {
    alive.current = true; refresh();
    const onFocus = () => { if (!popupRef.current || popupRef.current.closed) refresh(); };
    window.addEventListener('focus', onFocus); window.addEventListener('outlook-disconnected', refresh);
    return () => { alive.current = false; clearInterval(timer.current); window.removeEventListener('focus', onFocus); window.removeEventListener('outlook-disconnected', refresh); };
  }, [refresh]);
  const connect = async () => {
    setState(previous => ({ ...previous, loading: true, error: '' }));
    const popup = window.open('about:blank', 'alsight-outlook', 'width=650,height=760'); popupRef.current = popup;
    try {
      if (!popup) throw new Error('Allow pop-ups to connect your Outlook account.');
      const url = await base44.connectors.connectAppUser(OUTLOOK_CONNECTOR_ID);
      popup.location.href = url;
      clearInterval(timer.current);
      timer.current = setInterval(() => { if (popupRef.current?.closed) { clearInterval(timer.current); refresh(); } }, 500);
    } catch (error) { popup?.close(); setState(previous => ({ ...previous, loading: false, error: error.message })); }
  };
  const disconnect = async () => {
    setState(previous => ({ ...previous, loading: true, error: '' }));
    try { await base44.connectors.disconnectAppUser(OUTLOOK_CONNECTOR_ID); setState(previous => ({ ...previous, loading: false, connected: false, calendar: null })); window.dispatchEvent(new Event('outlook-disconnected')); }
    catch (error) { setState(previous => ({ ...previous, loading: false, error: error.message })); }
  };
  return { ...state, refresh, connect, disconnect };
}