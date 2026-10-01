import React from 'react';
import AliceInsight from '@/components/alice/AliceInsight';
import { STATUSES } from '@/components/valuations/valuationUtils';
import { formatDate } from '@/lib/portal';
export default function ValuationInsight({ project, valuations }) {
  const latest = [...valuations].sort((a, b) => b.number - a.number)[0];
  const to = latest ? `/projects/${project.id}?tab=valuations&valuation=${latest.id}` : undefined;
  const status = latest ? (STATUSES?.[latest.status] || latest.status?.replaceAll('_', ' ')) : '';
  const statements = [{ text: latest ? `The latest recorded valuation is ${latest.number}, with status ${status}.` : 'No valuations are recorded in the accessible register.', to }];
  if (latest?.payment_due_date) statements.push({ text: `Its recorded payment due date is ${formatDate(latest.payment_due_date)}.`, to });
  const signals = latest?.payment_due_date && latest.payment_due_date < new Date().toISOString().slice(0, 10) && !['paid', 'rejected'].includes(latest.status) ? [{ text: `Valuation ${latest.number} has a payment due date in the past and is not marked paid or rejected.`, to }] : [];
  return <AliceInsight statements={statements} signals={signals} evidence={latest ? [{ text: `Valuation ${latest.number} — ${status}${latest.submitted_at ? ` — submitted ${formatDate(latest.submitted_at)}` : ''}`, to }] : [{ text: 'Source: the currently accessible project valuation register.' }]} />;
}