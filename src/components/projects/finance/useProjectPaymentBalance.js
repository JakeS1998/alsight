import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { projectPOQuery } from '@/components/projects/poLinking';
export default function useProjectPaymentBalance(project) {
  const { user } = useAuth();
  return useQuery({ queryKey: ['project-payment-balance', user?.id, user?.role, project.id, project.project_number, project.name], staleTime: 60000, refetchOnWindowFocus: false, queryFn: async () => {
    const dated = { $nin: [null, ''], $exists: true };
    const poQuery = { ...projectPOQuery(project), status: { $ne: 'inactive' }, $and: [{ $or: [{ approved: true }, { sent: true }] }] };
    const invoices = await base44.entities.Invoice.aggregate({ query: { project_id: project.id, status: 'paid', paid_date: dated }, sum: 'amount' });
    const transactions = await base44.entities.ProjectCashFlow.aggregate({ query: { project_id: project.id, date: dated }, groupBy: 'type', sum: 'amount' });
    const orders = await base44.entities.PurchaseOrder.aggregate({ query: poQuery, sum: 'total_net_value' });
    const missing = await base44.entities.PurchaseOrder.filter({ ...poQuery, total_net_value: null }, { distinct: 'dataverse_id', limit: 1000 });
    if (missing.has_more) throw new Error('Too many purchase orders without recorded totals to verify the payment balance.');
    const ids = missing.items.filter(Boolean);
    const lines = ids.length ? await base44.entities.PurchaseOrderLineItem.aggregate({ query: { po_id: { $in: ids } }, sum: 'net_value' }) : { rows: [] };
    const received = (invoices.rows[0]?.sum_amount || 0) + (transactions.rows.find(row => row.type === 'received')?.sum_amount || 0);
    const spent = (transactions.rows.find(row => row.type === 'spent')?.sum_amount || 0) + (orders.rows[0]?.sum_total_net_value || 0) + (lines.rows[0]?.sum_net_value || 0);
    return { received, spent, net: received - spent };
  } });
}