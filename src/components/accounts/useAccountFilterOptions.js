import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
export default function useAccountFilterOptions() {
  const { user } = useAuth();
  return useQuery({ queryKey: ['account-filter-options',user?.id,user?.role], staleTime: 300000, enabled: !!user?.id, queryFn: async () => {
    const [organisation,company,region,owner] = await Promise.all(['organisation_type','company_type','region','account_manager_aad_id'].map(field => base44.entities.Account.filter({}, { distinct: field, limit: 100 })));
    const ownerIds = owner.items.filter(Boolean);
    const people = ownerIds.length ? await base44.entities.Contact.filter({ $or: [{ aad_id: { $in: ownerIds } },{ id: { $in: ownerIds } },{ dataverse_id: { $in: ownerIds } }] }, { limit: 100, fields: ['full_name','aad_id','dataverse_id'] }) : { items: [] };
    return { organisations: [...new Set([...organisation.items,...company.items].filter(Boolean))], regions: region.items.filter(Boolean), owners: ownerIds.map(id => [id,people.items.find(person => [person.id,person.aad_id,person.dataverse_id].includes(id))?.full_name || 'Assigned owner']) };
  } });
}