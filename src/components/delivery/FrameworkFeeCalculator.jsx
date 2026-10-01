import React, { useMemo } from 'react';
import { formatCurrency } from '@/lib/portal';
import { frameworkFeePct, frameworkFeeAmount } from '@/lib/frameworkFees';
import { additionalFeeTotal } from '@/components/delivery/additionalFeeStages';
import { AGREEMENT_FEE_ROUTES } from '@/components/delivery/frameworkAgreementRoute';


const CONTINGENCY_RE = /contingency/i;
const UKLF_RE = /uklf/i;

export function isUklfLine(line, uklfLabel) {
  const desc = (line.description || '').trim();
  return UKLF_RE.test(desc) || (uklfLabel && desc.toLowerCase() === uklfLabel.toLowerCase());
}

export function isContingencyLine(line, contingencyLabel) {
  const desc = (line.description || '').trim();
  return CONTINGENCY_RE.test(desc) || (contingencyLabel && desc.toLowerCase() === contingencyLabel.toLowerCase());
}

export function contractValueExclUklfAndContingency(supplierFees, feeLines, uklfLabel, contingencyLabel) {
  const eligibleFees = feeLines.filter(line => !isUklfLine(line, uklfLabel) && !isContingencyLine(line, contingencyLabel)).reduce((sum, line) => sum + additionalFeeTotal(line), 0);
  return Math.max(0, (Number(supplierFees) || 0) + eligibleFees);
}

export default function FrameworkFeeCalculator({ supplierFees, feeLines, settings, onApply }) {
  const { bands, uklf, contingency } = settings;
  const contractValue = useMemo(() => contractValueExclUklfAndContingency(supplierFees, feeLines, uklf, contingency), [supplierFees, feeLines, uklf, contingency]);
  const pct = useMemo(() => frameworkFeePct(bands, contractValue), [bands, contractValue]);
  const feeAmount = useMemo(() => frameworkFeeAmount(bands, contractValue), [bands, contractValue]);
  const hasUklfLine = useMemo(() => feeLines.some(line => isUklfLine(line, uklf)), [feeLines, uklf]);

  if (!bands.length) return <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">{settings.version ? `${settings.version} ${AGREEMENT_FEE_ROUTES[settings.route]} fee bands have not been configured. Add them in Admin settings before calculating the UKLF fee.` : 'A recognised project number is required to determine the framework fee bands.'} Existing fee lines are unchanged.</div>;

  return <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">UKLF {settings.version} · {AGREEMENT_FEE_ROUTES[settings.route]} fee (auto-calculated)</p>
        <p className="mt-0.5 text-sm text-muted-foreground">Payable under the {AGREEMENT_FEE_ROUTES[settings.route]}. Applied to all supplier, contractor and additional fees across every RIBA stage, excluding UKLF fee and contingency.</p>
      </div>
      <div className="text-right">
        <p className="text-lg font-semibold text-primary">{formatCurrency(feeAmount)}</p>
        <p className="text-xs text-muted-foreground">{pct}% of {formatCurrency(contractValue)}</p>
      </div>
    </div>
    <div className="mt-2 flex flex-wrap gap-2">
      <button type="button" onClick={() => onApply(feeAmount, pct, contractValue)} className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
        {hasUklfLine ? 'Update UKLF fee line' : 'Add UKLF fee line'}
      </button>
      <span className="self-center text-xs text-muted-foreground">Contract value (excl. UKLF &amp; contingency): {formatCurrency(contractValue)}</span>
    </div>
  </div>;
}