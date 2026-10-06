import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import organisationQueryPolicy from '@/components/data/organisationQueryPolicy';

export default function useProjectAssignmentSuppliers({ project, team, legalDocs, jcts, accountMap, delivery }) {
  const { user } = useAuth();
  const ids = [...new Set([...legalDocs, ...jcts].flatMap(doc => [doc.account_id, doc.contractor_id]).filter(Boolean))].sort();
  const numbers = [...new Set(team.map(member => member.supplier_company_number).filter(Boolean))].sort();
  const suppliers = useQuery({
    queryKey: ['project-assignment-suppliers', project.id, user?.id, user?.role, ids, numbers],
    enabled: !!user?.id && !delivery.isFetching && !!(ids.length || numbers.length), ...organisationQueryPolicy, staleTime: 300000,
    queryFn: async () => (await base44.entities.Account.filter({ $or: [
      ...(ids.length ? [{ id: { $in: ids } }, { dataverse_id: { $in: ids } }] : []),
      ...(numbers.length ? [{ company_number: { $in: numbers } }] : []),
    ] }, { limit: 50, fields: ['name', 'dataverse_id', 'company_number'] })).items,
  });
  const byId = {}, byNumber = {};
  [...Object.values(accountMap), ...(suppliers.data || [])].forEach(account => {
    [account.id, account.dataverse_id].filter(Boolean).forEach(id => { byId[id] = account; });
    if (account.company_number) byNumber[String(account.company_number).toLowerCase().replace(/[^a-z0-9]/g, '')] = account;
  });
  return { byId, byNumber, loading: suppliers.isFetching, error: suppliers.error };
}