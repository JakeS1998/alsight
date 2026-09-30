import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function useConfirmedInvoices(projects, enabled = true, scopeKey = '') {
  const ids = useMemo(() => projects.map(p => p.id).filter(Boolean).sort(), [projects]);
  const active = enabled && ids.length > 0;
  const query = useQuery({
    queryKey: ['dashboard-paid-invoices', scopeKey, ids], enabled: active, staleTime: 60000,
    queryFn: async () => {
      const { rows, truncated } = await base44.entities.Invoice.aggregate({ query: { project_id: { $in: ids }, status: 'paid', paid_date: { $gt: '' } }, groupBy: 'project_id', sum: ['amount'], limit: 1000 });
      if (truncated) throw new Error('Invoice totals exceeded the reporting limit.');
      return Object.fromEntries(rows.map(row => [row.project_id, Number(row.sum_amount) || 0]));
    },
  });
  return { amounts: active ? query.data || {} : {}, loading: active && query.isPending, error: query.error ? 'Could not load paid invoice totals.' : '' };
}