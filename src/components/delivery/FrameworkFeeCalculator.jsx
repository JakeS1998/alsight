import React, { useMemo } from 'react';
import { formatCurrency } from '@/lib/portal';
import { frameworkFeePct, frameworkFeeAmount, progressiveFeeBreakdown } from '@/lib/frameworkFees';
import { additionalFeeTotal } from '@/components/delivery/additionalFeeStages';
import { agreementFeeLabel } from '@/components/projects/agreementNames';


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

export default function FrameworkFeeCalculator({ supplierFees, feeLines, settings }) {
  const { bands, uklf, contingency } = settings;
  const contractValue = useMemo(() => contractValueExclUklfAndContingency(supplierFees, feeLines, uklf, contingency), [supplierFees, feeLines, uklf, contingency]);
  const pct = useMemo(() => frameworkFeePct(bands, contractValue), [bands, contractValue]);
  const progressive = settings.calculation === 'progressive';
  const feeAmount = useMemo(() => frameworkFeeAmount(bands, contractValue, settings.calculation), [bands, contractValue, settings.calculation]);


  if (!bands.length) return <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">{settings.version ? `${settings.version} ${agreementFeeLabel(settings.version, settings.route)} fee bands have not been configured. Add them in Admin settings before calculating the UKLF fee.` : 'A recognised project number is required to determine the framework fee bands.'} Existing fee lines are unchanged.</div>;

  return <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">UKLF {settings.version} · {agreementFeeLabel(settings.version, settings.route)} fee (live calculation)</p>
        <p className="mt-0.5 text-sm text-muted-foreground">Based on current supplier, contractor and additional fees across every RIBA stage, excluding UKLF fee and contingency. Updates with every proposal change.</p>
      </div>
      <div className="text-right">
        <p className="text-lg font-semibold text-primary">{formatCurrency(feeAmount)}</p>
        <p className="text-xs text-muted-foreground">{progressive ? 'Progressive bands on' : `${pct}% of`} {formatCurrency(contractValue)}</p>
      </div>
    </div>
    {progressive && <div className="mt-2 text-xs text-muted-foreground">{progressiveFeeBreakdown(bands, contractValue).map((row, index) => <p key={index}>{row.pct}% of {formatCurrency(row.portion)} = {formatCurrency(Math.round(row.fee * 100) / 100)}</p>)}</div>}
    <div className="mt-2 flex flex-wrap gap-2">

      <span className="self-center text-xs text-muted-foreground">Contract value (excl. UKLF &amp; contingency): {formatCurrency(contractValue)}</span>
    </div>
  </div>;
}