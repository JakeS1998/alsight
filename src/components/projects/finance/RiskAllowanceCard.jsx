import React from 'react';
import { Link } from 'react-router-dom';
import { moneyOrNR } from '@/components/projects/finance/financeMoney';
export default function RiskAllowanceCard({ estimate, projectId }) {
  const reason = ({ unavailable: 'Risk scores are unavailable.', no_register: 'No risk register entries; no estimate available.', unscored: `${estimate.unscored || 0} active risk(s) need a valid 1–25 risk index.`, no_contingency: 'No Client contingency recorded in the fee proposal.' })[estimate.reason];
  return <div className="rounded-xl border border-border bg-card p-4">
    <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Risk Allowance</h4>
    <p className="mt-1.5 font-heading text-lg font-semibold">{estimate.amount == null ? 'Not estimated' : moneyOrNR(estimate.amount)}</p>
    <p className="mt-1 text-xs text-muted-foreground">Client contingency: {moneyOrNR(estimate.contingency)}</p>
    {reason ? <p className="mt-1 text-xs text-muted-foreground">{reason}</p> : <>
      <p className="mt-1 text-xs text-muted-foreground">Indicative use: {(estimate.fraction * 100).toFixed(1)}% · Unallocated balance: {moneyOrNR(estimate.remaining)}</p>
      <p className="mt-1 text-xs text-muted-foreground">{estimate.active} active · {estimate.closed} closed / eliminated</p>
    </>}
    <details className="mt-2 text-xs text-muted-foreground"><summary className="cursor-pointer text-foreground">How it is calculated</summary>
      <p className="mt-2">Contingency × sum of active risk indices ÷ (25 × total registered risks). Each index is probability rating × impact rating; every registered risk receives an equal contingency share. Closed / eliminated risks contribute zero.</p>
      <p className="mt-2">A score-based budgeting assumption, not a measured probability, cost-based forecast or actual contingency spending. No estimate is made if active risks are unscored or the register is empty.</p>
    </details>
    <Link to={`/projects/${projectId}?tab=delivery`} className="mt-2 inline-block text-xs text-foreground underline">View risk register in Pathway</Link>
  </div>;
}