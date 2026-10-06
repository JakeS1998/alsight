import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";
import { listAll } from "@/components/data/loadAll";

const EMPTY = { orders: [], proposals: [], deliveries: [], actions: [] };
export default function usePortfolioExtras(enabled = true, scopeKey = '') {
  const query = useQuery({ queryKey: ['dashboard-portfolio-extras', scopeKey], enabled, staleTime: 60000, refetchOnMount: false,
    queryFn: async () => {
      const [orders, proposals, deliveries, actions] = await Promise.all([
        listAll(base44.entities.PurchaseOrder), listAll(base44.entities.FeeProposal), listAll(base44.entities.ProjectDelivery), listAll(base44.entities.ProjectAction),
      ]);
      return { orders, proposals, deliveries, actions };
    },
  });
  return { data: enabled ? query.data || EMPTY : EMPTY, loading: enabled && query.isPending, error: query.error ? 'Portfolio financial and risk data could not be loaded.' : '' };
}