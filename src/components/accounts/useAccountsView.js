import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import organisationQueryPolicy from '@/components/data/organisationQueryPolicy';
export default function useAccountsView({ filters, cursor, accountId } = {}) {
  const { user } = useAuth();
  const cache = useQueryClient();
  return useQuery({ queryKey: ['accounts-view','scoped-records-v2',user?.id,user?.role,filters || {},cursor || null,accountId || null], staleTime: 60000, ...organisationQueryPolicy, enabled: !!user?.id,
    queryFn: async () => (await base44.functions.invoke('getAccountsView',{ filters, cursor, accountId, revision: cache.getQueryData(['accounts-revision']) || 0 })).data });
}