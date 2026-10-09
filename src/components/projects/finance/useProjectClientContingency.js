import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { proposalClientContingency } from '@/components/delivery/clientContingency';
export default function useProjectClientContingency(projectId) {
  const client = useQueryClient(), { user } = useAuth();
  const key = ['project-client-contingency', user?.id, user?.role, projectId];
  const result = useQuery({ queryKey: key, queryFn: async () => {
    const current = await base44.entities.FeeProposal.filter({ project_id: projectId, is_current: true }, { sort: '-revision_number', limit: 1, fields: ['line_items'] });
    const proposal = current.items[0] || (await base44.entities.FeeProposal.filter({ project_id: projectId }, { sort: '-revision_number', limit: 1, fields: ['line_items'] })).items[0];
    return proposalClientContingency(proposal);
  }});
  useEffect(() => base44.entities.FeeProposal.subscribe(event => {
    if (event.type === 'delete' || event.data?.project_id === projectId) client.invalidateQueries({ queryKey: key });
  }), [client, projectId, user?.id, user?.role]);
  return result;
}