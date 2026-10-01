import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
const REGISTERS = [{ id: 6, entity: 'ProjectAction', done: 'done' }, { id: 7, entity: 'ProjectDecision', done: 'agreed' }, { id: 8, entity: 'ProjectRisk', done: 'closed' }];
export default function useJourneyRegisters(projectId) {
  const { user } = useAuth();
  const client = useQueryClient();
  const key = ['delivery-journey-registers', projectId, user?.id, user?.role];
  const query = useQuery({ queryKey: key, staleTime: 30000, queryFn: async () => Object.fromEntries(await Promise.all(REGISTERS.map(async register => {
    const result = await base44.entities[register.entity].aggregate({ query: { project_id: projectId }, groupBy: 'status' });
    const total = result.rows.reduce((sum, row) => sum + row.count, 0);
    const done = result.rows.find(row => row.status === register.done)?.count || 0;
    return [register.id, { percent: total ? (done === total ? 100 : Math.min(99, Math.round(done / total * 100))) : 0, detail: total ? `${done} of ${total} ${register.done}` : 'No entries yet' }];
  }))) });
  useEffect(() => {
    const refresh = event => { if (!event.data?.project_id || event.data.project_id === projectId) client.invalidateQueries({ queryKey: key }); };
    const unsubscribes = REGISTERS.map(register => base44.entities[register.entity].subscribe(refresh));
    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, [projectId, user?.id, user?.role, client]);
  return { registers: query.data || (query.error ? Object.fromEntries(REGISTERS.map(register => [register.id, { percent: null, detail: 'Unavailable' }])) : {}), error: query.error, loading: query.isPending };
}