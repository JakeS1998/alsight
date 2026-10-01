import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function useValuationMeta(projectId, userId) {
  const queryClient = useQueryClient();
  const queryKey = ['valuation-delivery-meta', projectId, userId];
  const query = useQuery({ queryKey, queryFn: async () => (await base44.functions.invoke('manageValuation', { action: 'meta', projectId })).data.meta });
  useEffect(() => {
    const refresh = event => {
      if (!event.data?.project_id || event.data.project_id === projectId) queryClient.invalidateQueries({ queryKey: ['valuation-delivery-meta', projectId, userId] });
    };
    const unsubscribers = [base44.entities.ProjectDelivery.subscribe(refresh), base44.entities.ProjectDecision.subscribe(refresh)];
    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, [projectId, userId, queryClient]);
  return query;
}