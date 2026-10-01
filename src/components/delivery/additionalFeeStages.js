export function additionalFeeStages(line) {
  if (line.stage_fees && typeof line.stage_fees === 'object') return line.stage_fees;
  return line.riba_stage || Number(line.internal_fee)
    ? { [line.riba_stage || 'Other']: line.internal_fee ?? 0 } : {};
}
export function additionalFeeTotal(line) {
  return Math.round(Object.values(additionalFeeStages(line)).reduce((sum, value) => sum + (Number(value) || 0), 0) * 100) / 100;
}