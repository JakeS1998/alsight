import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export default function usePDbrApplicability(project) {
  const { user } = useAuth();
  const client = useQueryClient();
  const key = ['pd-br-applicability', project.id, user?.id, user?.role];
  const query = useQuery({ queryKey: key, staleTime: 30000, queryFn: async () => {
    const page = await base44.entities.AppointmentApplicabilityDecision.filter({ project_id: project.id, appointment_type: 'appointment_pd_br' }, { sort: '-created_date', limit: 1 });
    return page.items[0] || null;
  } });
  useEffect(() => {
    return base44.entities.AppointmentApplicabilityDecision.subscribe(event => {
      if (!event.data?.project_id || event.data.project_id === project.id) client.invalidateQueries({ queryKey: key });
    });
  }, [project.id, user?.id, user?.role, client]);
  const saveDecision = async (applicability, reason) => {
    if (user?.role !== 'admin') throw new Error('Legal administrator access is required.');
    if (!['required', 'not_applicable'].includes(applicability) || !reason.trim() || reason.trim().length > 2000) throw new Error('Select applicability and provide a reason (up to 2,000 characters).');
    const decision = await base44.entities.AppointmentApplicabilityDecision.create({
      project_id: project.id, client_account_id: project.client_account_id || '', appointment_type: 'appointment_pd_br',
      applicability, reason: reason.trim(), recorded_by_name: (user.full_name || user.email || 'Administrator').slice(0, 200),
    });
    client.setQueryData(key, decision);
    client.invalidateQueries({ queryKey: ['pm-project-pathway'] });
    return decision;
  };
  return { ...query, decision: query.data, canEdit: user?.role === 'admin', saveDecision };
}