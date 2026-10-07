import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import useProjectPaymentBalance from '@/components/projects/finance/useProjectPaymentBalance';
export default function useHealthFacts(project) {
  const { user } = useAuth();
  const payments = useProjectPaymentBalance(project);
  const facts = useQuery({ queryKey: ['alice-health-facts', user?.id, user?.role, project.id], staleTime: 60000, queryFn: async () => {
    const scope = { project_id: project.id };
    const [decisions, risks, riskCount, overdue] = await Promise.all([
      base44.entities.ProjectDecision.aggregate({ query: scope, groupBy: 'status', sum: 'financial_adjustment' }),
      base44.entities.ProjectRisk.aggregate({ query: { ...scope, status: 'open' }, groupBy: 'rag', sum: 'weighted_cost' }),
      base44.entities.ProjectRisk.count(scope),
      base44.entities.Valuation.count({ ...scope, payment_due_date: { $lt: new Date().toISOString().slice(0, 10), $nin: [null, ''] }, status: { $nin: ['paid', 'rejected'] } }),
    ]);
    return { approved: decisions.rows.find(r => r.status === 'agreed')?.sum_financial_adjustment || 0, pending: decisions.rows.find(r => r.status === 'open')?.sum_financial_adjustment || 0, riskAllowance: risks.rows.reduce((s, r) => s + (r.sum_weighted_cost || 0), 0), riskCount, red: risks.rows.find(r => r.rag === 'red')?.count || 0, openRisks: risks.rows.reduce((s, r) => s + r.count, 0), overdue };
  } });
  return { ...facts, data: facts.data ? { ...facts.data, paymentBalance: payments.data } : undefined, isPending: facts.isPending || payments.isPending, error: facts.error || payments.error };
}