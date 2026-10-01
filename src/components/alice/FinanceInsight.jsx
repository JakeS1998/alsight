import React from 'react';
import AliceInsight from '@/components/alice/AliceInsight';
import { moneyOrNR, moneySigned } from '@/components/projects/finance/financeMoney';
import { formatDate } from '@/lib/portal';
export default function FinanceInsight({ project, summary, health, delivery }) {
  const to = `/projects/${project.id}?tab=delivery`;
  const statements = [
    { text: summary.currentContractValue == null ? 'The construction contract sum has not been recorded; current contract value cannot be calculated.' : `The current contract value is ${moneyOrNR(summary.currentContractValue)}, including ${moneySigned(summary.approvedVariations)} of net agreed adjustments.`, to },
    { text: summary.certifiedToDate == null ? 'No certified value is recorded in the valuation position.' : `${moneyOrNR(summary.certifiedToDate)} has been certified to date.`, to: `/projects/${project.id}?tab=valuations` },
    { text: `${moneySigned(summary.pendingVariations)} of net open adjustments is excluded from current contract value.`, to },
  ];
  const evidence = [{ text: `Construction contract sum: ${moneyOrNR(summary.contractSum)}`, to }, ...summary.approvedDecisions.map(d => ({ text: `${d.decision_title} — Agreed — ${moneySigned(d.financial_adjustment)}`, to })), ...summary.pendingDecisions.map(d => ({ text: `${d.decision_title} — Open — ${moneySigned(d.financial_adjustment)}`, to })), { text: `Valuation position: certified ${moneyOrNR(summary.certifiedToDate)}; paid ${moneyOrNR(summary.paidToDate)}`, to: `/projects/${project.id}?tab=valuations` }];
  const age = delivery?.updated_date ? Math.floor((Date.now() - Date.parse(delivery.updated_date)) / 86400000) : null;
  const signals = [];
  if (age >= 30) signals.push({ text: `The Pathway record was last updated ${age} days ago (${formatDate(delivery.updated_date)}); this is not a field-specific forecast update date.`, to });
  return <AliceInsight statements={statements} evidence={evidence} signals={signals} detail={`Commercial health uses existing ALSight rules: ${health.factors.map(f => f.label).join('; ') || 'no current commercial rule is triggered'}. Forecast final cost includes net open adjustments and the recorded weighted costs of open risks; it is not an approved commitment.`} />;
}