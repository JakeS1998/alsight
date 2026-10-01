import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { isAlsStaff } from '@/components/delivery/supplierFsf';

export default function useSupplierFsf(user, proposalId, projectId) {
  const allowed = isAlsStaff(user);
  const [draft, setDraft] = useState(null);
  const query = useQuery({
    queryKey: ['fee-proposal-fsf', user?.id, proposalId],
    enabled: allowed && !!proposalId,
    queryFn: async () => {
      const page = await base44.entities.FeeProposalFsf.filter({ fee_proposal_id: proposalId }, { limit: 1 });
      return page.items[0] || null;
    },
  });
  const savedRates = Object.fromEntries((query.data?.supplier_rates || []).map(row => [row.supplier_key, row.fsf_pct]));
  const rates = allowed ? (draft?.proposalId === proposalId ? draft.rates : savedRates) : {};
  const update = (key, value) => setDraft({ proposalId, rates: { ...rates, [key]: value } });
  const save = async () => {
    if (!allowed || !proposalId) return;
    if (query.isPending || query.isError) throw new Error('FSF rates could not be loaded. Please reload before saving.');
    const supplier_rates = Object.entries(rates).map(([supplier_key, value]) => ({ supplier_key, fsf_pct: Number(value) || 0 }));
    if (supplier_rates.some(row => !Number.isFinite(row.fsf_pct) || row.fsf_pct < 0 || row.fsf_pct > 100)) throw new Error('Each FSF percentage must be between 0 and 100.');
    await base44.entities.FeeProposalFsf.upsert([{ fee_proposal_id: proposalId, project_id: projectId, supplier_rates }], { key: 'fee_proposal_id' });
    await query.refetch();
  };
  return { allowed, rates, update, save, loading: allowed && !!proposalId && query.isPending, error: allowed ? query.error : null };
}