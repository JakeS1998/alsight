import { commercialHealth } from '@/components/projects/finance/financeCalculations';
import { asNum } from '@/components/projects/finance/financeMoney';
export default function projectHealthDimensions(data, facts) {
  const delivery = data.delivery || {};
  const baseline = Date.parse(delivery.original_pc), forecast = Date.parse(delivery.forecast_pc);
  const days = Number.isFinite(baseline) && Number.isFinite(forecast) ? Math.round((forecast - baseline) / 86400000) : null;
  const contract = asNum(delivery.contract_sum);
  const current = contract == null ? null : contract + facts.approved;
  const summary = { contractSum: contract, currentContractValue: current, forecastFinalCost: current == null ? null : current + facts.pending + facts.riskAllowance, pendingVariations: facts.pending, approvedVariations: facts.approved };
  const commercial = commercialHealth(summary, []);
  const legalStatus = !data.legalTotal ? 'Insufficient Data' : data.legalPending ? 'Watch' : 'Healthy';
  return [
    { name: 'Programme', status: days == null ? 'Insufficient Data' : days > 0 ? 'Watch' : 'Healthy', reason: days == null ? 'Original and forecast PC dates are both required for comparison.' : days > 0 ? `Forecast PC is ${days} days later than the recorded original PC.` : 'Forecast PC is not later than the recorded original PC.', tab: 'delivery' },
    { name: 'Commercial', status: contract == null ? 'Insufficient Data' : facts.overdue || commercial.status === 'risk' ? 'At Risk' : commercial.status === 'watch' ? 'Watch' : 'Healthy', reason: contract == null ? 'Construction contract sum is not recorded.' : facts.overdue ? `${facts.overdue} unpaid/non-rejected valuations have a payment due date in the past.` : commercial.factors.map(f => f.label).join('; ') || 'No existing commercial threshold is exceeded.', tab: 'finance' },
    { name: 'Delivery', status: 'Insufficient Data', reason: delivery.pso_dma_date || data.dmaSigned || data.alternativeSigned ? 'Agreement PSO sign-off is recorded, but full Pathway readiness is assessed stage by stage; no overall delivery health is inferred.' : 'Agreement PSO sign-off is not recorded; full stage readiness is shown in Pathway.', tab: 'delivery' },
    { name: 'Legal', status: legalStatus, reason: !data.legalTotal ? 'No applicable legal records are available.' : data.legalPending ? `${data.legalPending} recorded agreements have no execution/PO evidence.` : 'Recorded applicable agreements have execution/PO evidence; missing required agreements are not assessed here.', tab: 'drafting' },
    { name: 'Documents', status: data.outstanding ? 'Watch' : 'Insufficient Data', reason: data.outstanding ? `${data.outstanding} active warranties remain outstanding.` : 'No outstanding active warranties are recorded; completeness of other document classes is not assessed here.', tab: 'warranties' },
    { name: 'Risk', status: !facts.riskCount ? 'Insufficient Data' : facts.red ? 'At Risk' : facts.openRisks ? 'Watch' : 'Healthy', reason: !facts.riskCount ? 'No risk records are available.' : facts.red ? `${facts.red} open risks have a recorded red rating.` : facts.openRisks ? `${facts.openRisks} risks remain open.` : 'All recorded risks are closed.', tab: 'delivery' },
  ];
}