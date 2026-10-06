import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { listAll } from '@/components/data/loadAll';

export default function useDashboardDirectory(user, scopeKey) {
  const enabled = !!user?.id && user.role !== 'project_manager';
  const needsContact = ['bdm', 'bsm'].includes(user?.role) && !!user?.email;
  const contacts = useQuery({
    queryKey: ['dashboard-identity', scopeKey], enabled: enabled && needsContact,
    staleTime: 60000, refetchOnMount: false,
    queryFn: async () => {
      const email = user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const page = await base44.entities.Contact.filter({ email: { $regex: `^${email}$`, $options: 'i' } }, { limit: 1, fields: ['aad_id'] });
      return page.items[0] || null;
    },
  });
  const accounts = useQuery({
    queryKey: ['dashboard-accounts', scopeKey], enabled,
    staleTime: 60000, refetchOnMount: false,
    queryFn: () => listAll(base44.entities.Account, '-name'),
  });
  return {
    contact: contacts.data, accounts: accounts.data || [],
    identityReady: !needsContact || contacts.isSuccess,
    loading: enabled && (accounts.isPending || (needsContact && contacts.isPending)),
    error: contacts.error?.message || accounts.error?.message,
  };
}