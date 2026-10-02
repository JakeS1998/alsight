import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import riskApprovalProgress from '@/components/delivery/riskApprovalProgress';
export default function useRiskRegisterApproval(projectId) {
  const { user } = useAuth();
  const client = useQueryClient();
  const key = ['risk-register-approval', projectId, user?.id, user?.role];
  const query = useQuery({ queryKey: key, staleTime: 30000, refetchInterval: query => query.state.data?.packets?.some(packet => packet.status === 'active') ? 30000 : false, queryFn: async () => (await base44.functions.invoke('manageRiskApprovals', { action: 'status', project_id: projectId })).data });
  const refresh = () => client.invalidateQueries({ queryKey: key });
  useEffect(() => {
    const changed = event => { if (!event.data?.project_id || event.data.project_id === projectId) client.invalidateQueries({ queryKey: key }); };
    const unsubscribes = [base44.entities.ProjectRisk.subscribe(changed)];
    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, [client, projectId, user?.id, user?.role]);
  const progress = query.data ? riskApprovalProgress(query.data.count, query.data.approvals) : { percent: null, detail: query.error ? 'Approval progress unavailable' : 'Checking approvals…' };
  return { ...query, refresh, progress };
}