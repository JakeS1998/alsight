import { frameworkFeeAmount, frameworkFeePct } from '@/lib/frameworkFees';
import { contractValueExclUklfAndContingency, isUklfLine } from '@/components/delivery/FrameworkFeeCalculator';

export default function automaticFrameworkFeeLines(lines, supplierFees, settings, singleTask) {
  if (!settings?.bands?.length) return lines;
  const value = contractValueExclUklfAndContingency(supplierFees, lines, settings.uklf, settings.contingency);
  const amount = frameworkFeeAmount(settings.bands, value, settings.calculation);
  const pct = frameworkFeePct(settings.bands, value);
  const existing = lines.find(line => isUklfLine(line, settings.uklf));
  const stage = singleTask ? 'Task' : 'RIBA 5-7';
  const feeLine = {
    ...existing,
    description: `${settings.uklf} (${settings.calculation === 'progressive' ? 'progressive single-task bands' : `${pct}% of contract value`})`,
    riba_stage: stage,
    stage_fees: { [stage]: amount },
    internal_fee: amount,
    include_on_client: existing?.include_on_client !== false,
  };
  if (!existing) return [...lines, feeLine];
  let replaced = false;
  return lines.flatMap(line => {
    if (!isUklfLine(line, settings.uklf)) return [line];
    if (replaced) return [];
    replaced = true;
    return [feeLine];
  });
}