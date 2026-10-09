import { additionalFeeStages, additionalFeeTotal } from '@/components/delivery/additionalFeeStages';

export const isClientContingency = line => line.line_type === 'client_contingency' || /contingency/i.test(line.description || '');
export function requiredClientContingency(lines, singleTask = false) {
  const existing = lines.filter(isClientContingency);
  const stage = singleTask ? 'Task' : 'RIBA 5-7';
  const fees = {};
  existing.forEach(line => Object.entries(additionalFeeStages(line)).forEach(([key, value]) => {
    const target = singleTask ? 'Task' : key === 'Other' || key === 'Task' ? stage : key;
    fees[target] = (fees[target] || 0) + (Number(value) || 0);
  }));
  if (!Object.keys(fees).length) fees[stage] = 0;
  const contingency = { description: 'Client contingency', line_type: 'client_contingency', riba_stage: stage, stage_fees: fees, include_on_client: true };
  contingency.internal_fee = additionalFeeTotal(contingency);
  if (!existing.length) return [...lines, contingency];
  let replaced = false;
  return lines.flatMap(line => {
    if (!isClientContingency(line)) return [line];
    if (replaced) return [];
    replaced = true;
    return [contingency];
  });
}
export function proposalClientContingency(proposal) {
  if (!proposal) return null;
  const lines = JSON.parse(proposal.line_items || '[]');
  const contingency = lines.filter(isClientContingency);
  return contingency.length ? Math.round(contingency.reduce((sum, line) => sum + additionalFeeTotal(line), 0) * 100) / 100 : null;
}