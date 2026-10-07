import { formatCurrency } from '@/lib/portal';
import { asNum } from './financeMoney';

export const RIBA_STAGES = ['riba_1', 'riba_2', 'riba_3', 'riba_4', 'riba_5_7'];
export const RIBA_LABELS = { riba_1: 'RIBA 1', riba_2: 'RIBA 2', riba_3: 'RIBA 3', riba_4: 'RIBA 4', riba_5_7: 'RIBA 5–7' };

// Parse the delivery_team JSON string into an array
export function parseDeliveryTeam(delivery) {
  if (!delivery?.delivery_team) return [];
  try {
    const parsed = JSON.parse(delivery.delivery_team);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

// Non-contractor team members with per-stage fees
export function consultantFees(delivery) {
  return parseDeliveryTeam(delivery).filter(m => {
    const role = String(m.role || '').toLowerCase();
    return role && role !== 'contractor';
  }).map(m => {
    const fees = m.fees || {};
    const stageFees = {};
    let total = 0;
    let hasAny = false;
    RIBA_STAGES.forEach(s => {
      const v = asNum(fees[s]);
      stageFees[s] = v;
      if (v != null) { total += v; hasAny = true; }
    });
    return { role: m.role, supplier: m.supplier_company_number || '', stageFees, total: hasAny ? total : null };
  });
}

// Core commercial figures from delivery, decisions and valuations
export function commercialSummary(delivery, decisions, valuations, risks) {
  const contractSum = asNum(delivery?.contract_sum);
  const approvedDecisions = decisions.filter(d => d.status === 'agreed');
  const pendingDecisions = decisions.filter(d => d.status === 'open');
  const approvedAdditions = approvedDecisions.filter(d => (asNum(d.financial_adjustment) || 0) > 0).reduce((s, d) => s + (asNum(d.financial_adjustment) || 0), 0);
  const approvedOmissions = approvedDecisions.filter(d => (asNum(d.financial_adjustment) || 0) < 0).reduce((s, d) => s + Math.abs(asNum(d.financial_adjustment) || 0), 0);
  const approvedVariations = approvedAdditions - approvedOmissions;
  const approvedVariationCount = approvedDecisions.filter(d => (asNum(d.financial_adjustment) || 0) > 0).length;
  const approvedOmissionCount = approvedDecisions.filter(d => (asNum(d.financial_adjustment) || 0) < 0).length;
  const pendingVariations = pendingDecisions.reduce((s, d) => s + (asNum(d.financial_adjustment) || 0), 0);
  const pendingVariationCount = pendingDecisions.length;
  const currentContractValue = contractSum != null ? contractSum + approvedVariations : null;
  const approvedVals = valuations.filter(v => ['approved', 'paid'].includes(v.status));
  const certifiedToDate = approvedVals.length > 0 ? Math.max(0, ...approvedVals.map(v => asNum(v.approved_gross) || 0)) : null;
  const paidVals = valuations.filter(v => v.status === 'paid');
  const paidToDate = paidVals.length > 0 ? paidVals.reduce((s, v) => s + (asNum(v.amount_paid) || 0), 0) : null;
  const remainingContractValue = currentContractValue != null && certifiedToDate != null ? currentContractValue - certifiedToDate : null;
  const openRisks = (risks || []).filter(r => r.status === 'open');
  const riskAllowance = openRisks.length > 0 ? openRisks.reduce((s, r) => s + (asNum(r.weighted_cost) || 0), 0) : null;
  const forecastFinalCost = currentContractValue != null ? currentContractValue + (pendingVariations || 0) + (riskAllowance || 0) : null;
  return { contractSum, approvedAdditions, approvedOmissions, approvedVariations, approvedVariationCount, approvedOmissionCount, pendingVariations, pendingVariationCount, currentContractValue, certifiedToDate, paidToDate, remainingContractValue, riskAllowance, forecastFinalCost, approvedDecisions, pendingDecisions };
}

// Derive a non-arbitrary commercial health status from live factors
export function commercialHealth(summary, valuations, paymentBalance) {
  const factors = [];
  if (paymentBalance?.net < 0) factors.push({ label: `Negative net payment balance of ${formatCurrency(paymentBalance.net)}: client receipts are below recorded spending and approved/issued POs, treated as paid outgoings.`, level: 'risk' });
  const today = new Date().toISOString().slice(0, 10);
  if (summary.contractSum == null) factors.push({ label: 'Contract sum not recorded', level: 'watch' });
  if (summary.forecastFinalCost != null && summary.currentContractValue != null && summary.forecastFinalCost > summary.currentContractValue)
    factors.push({ label: `Forecast final cost exceeds current contract value by ${formatCurrency(summary.forecastFinalCost - summary.currentContractValue)}`, level: 'risk' });
  if (summary.pendingVariations > 0) {
    const significant = summary.currentContractValue > 0 && summary.pendingVariations > summary.currentContractValue * 0.05;
    factors.push({ label: `${formatCurrency(summary.pendingVariations)} in pending variations awaiting approval`, level: significant ? 'risk' : 'watch' });
  }
  const overdueVal = valuations.find(v => v.payment_due_date && !['paid', 'rejected'].includes(v.status) && v.payment_due_date < today);
  if (overdueVal) factors.push({ label: `Valuation ${overdueVal.number} payment overdue`, level: 'risk' });
  const approvedNotPaid = valuations.find(v => v.status === 'approved' && v.payment_status !== 'paid');
  if (approvedNotPaid) factors.push({ label: `Valuation ${approvedNotPaid.number} approved but not yet paid`, level: 'watch' });
  if (summary.contractSum > 0 && summary.approvedVariations > summary.contractSum * 0.10)
    factors.push({ label: 'Approved variations exceed 10% of original contract sum', level: 'watch' });
  if (factors.length === 0) return { status: summary.contractSum != null ? 'healthy' : 'not_enough_data', factors };
  return { status: factors.some(f => f.level === 'risk') ? 'risk' : 'watch', factors };
}

// Build commercial alert list from live data — only real exceptions
export function commercialAlerts(summary, valuations, pos, project, consultants) {
  const alerts = [];
  const today = new Date().toISOString().slice(0, 10);
  if (summary.contractSum == null) alerts.push({ label: 'Contract sum not recorded', to: `/projects/${project.id}?tab=delivery` });
  if (summary.forecastFinalCost != null && summary.currentContractValue != null && summary.forecastFinalCost > summary.currentContractValue)
    alerts.push({ label: 'Forecast final cost exceeds current contract value', to: `/projects/${project.id}?tab=finance` });
  const pending = summary.pendingDecisions;
  if (pending.length > 0) alerts.push({ label: `${pending.length} variation${pending.length !== 1 ? 's' : ''} awaiting approval`, to: `/projects/${project.id}?tab=delivery` });
  const overdueVal = valuations.find(v => v.payment_due_date && !['paid', 'rejected'].includes(v.status) && v.payment_due_date < today);
  if (overdueVal) alerts.push({ label: `Valuation ${overdueVal.number} payment overdue`, to: `/projects/${project.id}?tab=valuations&valuation=${overdueVal.id}` });
  if (pos.length === 0 && project.project_number) alerts.push({ label: 'No purchase orders linked to this project', to: `/projects/${project.id}?tab=finance` });
  return alerts;
}

// Commercial milestones from existing dated records
export function commercialMilestones(project, feeProposals, pos, jcts, valuations, delivery) {
  const ms = [];
  const fp = feeProposals.filter(f => f.client_approval_date).sort((a, b) => new Date(b.client_approval_date) - new Date(a.client_approval_date))[0];
  if (fp) ms.push({ label: 'Fee Proposal approved', date: fp.client_approval_date, done: true });
  const firstPO = pos.filter(p => p.sent_date || p.approval_date).sort((a, b) => new Date(a.sent_date || a.approval_date) - new Date(b.sent_date || b.approval_date))[0];
  if (firstPO) ms.push({ label: 'First PO issued', date: firstPO.sent_date || firstPO.approval_date, done: true });
  const jct = jcts.find(j => j.date_of_execution);
  if (jct) ms.push({ label: 'JCT executed', date: jct.date_of_execution, done: true });
  const firstVal = valuations.filter(v => v.submitted_at).sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at))[0];
  if (firstVal) ms.push({ label: 'First valuation', date: firstVal.submitted_at, done: true });
  if (project.practical_completion_date) ms.push({ label: 'Practical Completion', date: project.practical_completion_date, done: true });
  if (delivery?.final_account_status === 'agreed' || delivery?.final_account_status === 'closed') ms.push({ label: 'Final account agreed', date: null, done: true });
  return ms.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

// Retention info from valuations and project dates
export function retentionInfo(valuations, project) {
  const approved = valuations.filter(v => ['approved', 'paid'].includes(v.status));
  const latest = [...approved].sort((a, b) => b.number - a.number)[0];
  const pct = latest ? asNum(latest.retention_percent) : null;
  const held = approved.reduce((s, v) => s + (asNum(v.approved_retention) || 0), 0);
  if (pct == null && held === 0) return null;
  const pcDate = project.practical_completion_date;
  return { pct, held, pcDate, firstRelease: pcDate ? pcDate : null, finalRelease: pcDate ? addMonths(pcDate, 12) : null };
}

function addMonths(dateStr, n) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}