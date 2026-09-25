export const STATUSES = { draft: 'Draft', submitted: 'Submitted', under_review: 'Under Review', returned: 'Returned for Amendment', approved: 'Approved', rejected: 'Rejected', paid: 'Paid' };
export const PAYMENT = { awaiting_invoice: 'Awaiting Invoice', invoice_received: 'Invoice Received', approved_for_payment: 'Approved for Payment', scheduled: 'Scheduled for Payment', paid: 'Paid', on_hold: 'Payment on Hold' };
export const STATUS_STYLE = { draft: 'bg-slate-100 text-slate-700', submitted: 'bg-blue-100 text-blue-700', under_review: 'bg-amber-100 text-amber-800', returned: 'bg-orange-100 text-orange-800', approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700', paid: 'bg-green-200 text-green-900' };
export const sum = (list, fn) => (list || []).reduce((total, item) => total + (Number(fn(item)) || 0), 0);
export function valuationTotals(record, previousCertified = 0) {
  const items = record.items || [];
  const gross = sum(items, i => Number(i.previous || 0) + Number(i.completed || 0) + Number(i.materials || 0));
  const variations = sum(items, i => i.variations);
  const contract = sum(items, i => i.contract_value);
  const current = Math.max(0, gross - previousCertified);
  const retention = current * Number(record.retention_percent || 0) / 100;
  const deductions = sum(record.deductions, d => d.amount);
  return { gross, variations, contract, revised: contract + variations, current, retention, deductions, due: current - retention - deductions };
}
export function StatusPill({ status }) { return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[status] || STATUS_STYLE.draft}`}>{STATUSES[status] || status}</span>; }