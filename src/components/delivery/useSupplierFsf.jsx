import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { isAlsStaff } from '@/components/delivery/supplierFsf';

export default function useSupplierFsf(user, proposalId, projectId) {
  const allowed = isAlsStaff(user);
  const cache = useQueryClient();
  const [draft, setDraft] = useState(null);
  const query = useQuery({
    queryKey: ['fee-proposal-fsf', user?.id, proposalId],
    enabled: allowed && !!proposalId,
    queryFn: async () => {
      const page = await base44.entities.FeeProposalFsf.filter({ fee_proposal_id: proposalId }, { limit: 1 });
      return page.items[0] || null;
    },
  });
  const savedRows = query.data?.supplier_rates || [];
  const savedRates = Object.fromEntries(savedRows.map(row => [row.supplier_key, { early: row.fsf_pct, late: row.fsf_riba_5_7_pct ?? row.fsf_pct }]));
  const rates = allowed ? (draft?.proposalId === proposalId ? draft.rates : savedRates) : {};
  const update = (key, band, value) => setDraft(previous => {
    const current = previous?.proposalId === proposalId ? previous.rates : savedRates;
    return { proposalId, rates: { ...current, [key]: { ...current[key], [band]: value } } };
  });
  const save = async (contractorRows) => {
    if (!allowed || !proposalId) return;
    if (query.isPending || query.isError) throw new Error('FSF rates could not be loaded. Please reload before saving.');
    const records = new Map(savedRows.map(row => [row.supplier_key, row]));
    const bases = new Map(contractorRows.map(row => [row.key, row.bands]));
    const supplier_rates = Object.entries(rates).map(([supplier_key, value]) => {
      const bands = bases.get(supplier_key), early = bands?.find(band => band.key === 'early'), late = bands?.find(band => band.key === 'late');
      const fsf_pct = Number(value.early ?? 0);
      if (bands?.some(band => band.key === 'task')) return { supplier_key, fsf_pct };
      if (!bands) return records.get(supplier_key) || { supplier_key, fsf_pct };
      return { supplier_key, fsf_pct, fsf_riba_5_7_pct: Number(value.late ?? 0), riba_0_4_base: early?.base ?? 0, riba_5_7_base: late?.base ?? 0 };
    });
    if (supplier_rates.some(row => [row.fsf_pct, row.fsf_riba_5_7_pct ?? 0].some(pct => !Number.isFinite(pct) || pct < 0 || pct > 100))) throw new Error('Each FSF percentage must be between 0 and 100.');
    await base44.entities.FeeProposalFsf.upsert([{ fee_proposal_id: proposalId, project_id: projectId, supplier_rates }], { key: 'fee_proposal_id' });
    await query.refetch();
    await cache.invalidateQueries({ queryKey: ['supplier-commission'] });
  };
  return { allowed, rates, update, save, loading: allowed && !!proposalId && query.isPending, error: allowed ? query.error : null };
}