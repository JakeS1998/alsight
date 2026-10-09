import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
export default function useProjectRiskScores(projectId) {
  const client = useQueryClient(), { user } = useAuth();
  const key = ['project-risk-score-summary', user?.id, user?.role, projectId];
  const result = useQuery({ queryKey: key, enabled: !!projectId,
    refetchOnMount: 'always', refetchOnWindowFocus: true,
    queryFn: async () => {
      const result = await base44.entities.ProjectRisk.aggregate({ query: { project_id: projectId }, groupBy: ['status', 'risk_index'], sum: 'risk_index', limit: 1000 });
      if (result.truncated) throw new Error('Risk score summary is incomplete; no allowance has been estimated.');
      return result;
    },
  });
  useEffect(() => base44.entities.ProjectRisk.subscribe(event => {
    if (event.type === 'delete' || event.data?.project_id === projectId) client.invalidateQueries({ queryKey: key });
  }), [client, projectId, user?.id, user?.role]);
  return result;
}