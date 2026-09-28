import React from 'react';
import { formatCurrency } from '@/lib/portal';

const stages = [['riba_1', 'RIBA 1'], ['riba_2', 'RIBA 2'], ['riba_3', 'RIBA 3'], ['riba_4', 'RIBA 4'], ['riba_5_7', 'RIBA 5–7']];

export default function OpportunityTeamFees({ team = [] }) {
  const lines = team.flatMap(member => stages.flatMap(([key, label]) => {
    const fee = Number(member.fees?.[key]) || 0;
    return fee > 0 ? [{ name: member.supplier_name || member.role || 'Consultant', role: member.role, stage: label, fee }] : [];
  }));
  const total = lines.reduce((sum, line) => sum + line.fee, 0);
  return <div className="min-w-0 space-y-2 rounded-lg border border-border p-4">
    <h3 className="text-sm font-semibold">Design team fees</h3>
    <p className="text-xs text-muted-foreground">Drawn from the saved Design Team. Update fees there; they carry into the project fee proposal on handover.</p>
    {lines.length ? <><div className="space-y-2 text-sm">{lines.map((line, index) => <div key={index} className="flex min-w-0 flex-wrap justify-between gap-x-3 border-b border-border pb-2 last:border-0 last:pb-0"><span className="min-w-0 break-words">{line.name}{line.role && line.role !== line.name ? ` · ${line.role}` : ''} · {line.stage}</span><span className="shrink-0 font-medium">{formatCurrency(line.fee)}</span></div>)}</div><p className="text-sm font-semibold">Total design team fees: {formatCurrency(total)}</p></> : <p className="text-sm text-muted-foreground">No design team fees entered yet.</p>}
  </div>;
}