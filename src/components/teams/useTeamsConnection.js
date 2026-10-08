import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import teamsRequest, { TEAMS_CONNECTOR_ID } from '@/components/teams/teamsClient';
export default function useTeamsConnection() {
  const [state, setState] = useState({ loading: true, user: null, connected: false, name: '', error: '' });
  const alive = useRef(true), timer = useRef(null);
  const refresh = useCallback(async () => {
    try {
      if (!await base44.auth.isAuthenticated()) { if (alive.current) setState({ loading: false, user: null, connected: false, error: '' }); return; }
      const user = await base44.auth.me();
      try { const data = await teamsRequest('status'); if (alive.current) setState({ loading: false, user, connected: true, name: data.name, error: '' }); }
      catch (error) { if (alive.current) setState({ loading: false, user, connected: false, error: error.code === 'TEAMS_NOT_CONNECTED' ? '' : error.message }); }
    } catch (error) { if (alive.current) setState(previous => ({ ...previous, loading: false, error: error.message })); }
  }, []);
  useEffect(() => { alive.current = true; refresh(); return () => { alive.current = false; clearInterval(timer.current); }; }, [refresh]);
  const connect = async () => {
    setState(previous => ({ ...previous, loading: true, error: '' }));
    const popup = window.open('about:blank', 'alsight-teams', 'width=650,height=760');
    try {
      if (!popup) throw new Error('Allow pop-ups to connect Teams.');
      popup.location.href = await base44.connectors.connectAppUser(TEAMS_CONNECTOR_ID);
      clearInterval(timer.current); timer.current = setInterval(() => { if (popup.closed) { clearInterval(timer.current); refresh(); } }, 500);
    } catch (error) { popup?.close(); setState(previous => ({ ...previous, loading: false, error: error.message })); }
  };
  const disconnect = async () => {
    setState(previous => ({ ...previous, loading: true, error: '' }));
    try { await base44.connectors.disconnectAppUser(TEAMS_CONNECTOR_ID); if (alive.current) setState(previous => ({ ...previous, loading: false, connected: false, name: '' })); }
    catch (error) { if (alive.current) setState(previous => ({ ...previous, loading: false, error: error.message })); }
  };
  return { ...state, connect, disconnect, refresh };
}