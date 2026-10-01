import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency } from '@/lib/portal';
import SingleTaskProgressForm from '@/components/delivery/SingleTaskProgressForm';
import taskProposalTotal from '@/components/delivery/taskProposalTotal';

export default function SingleTaskDelivery({ project, legalDocs, delivery, savedDelivery, feeProposals, setField, onSave, saving, fees, registers, handover }) {
  const { user } = useAuth();
  const key = `als-single-task-phase:${user?.id}:${project.id}`;
  const current = feeProposals.find(proposal => proposal.is_current) || feeProposals[0];
  const agreement = legalDocs.find(doc => doc.status !== 'inactive' && doc.document_type === 'single_task_agreement');
  const completed = !!savedDelivery?.pc_achieved && savedDelivery?.client_handover === 'complete';
  const agreed = agreement?.executed === 'yes' && current?.status === 'accepted';
  const active = completed ? 'completion' : agreed ? 'works' : 'agreement';
  const [phase, setPhase] = useState(() => ['agreement', 'works', 'completion'].includes(localStorage.getItem(key)) ? localStorage.getItem(key) : active);
  const [visited, setVisited] = useState(() => new Set([phase]));
  const select = value => { setPhase(value); setVisited(previous => new Set([...previous, value])); localStorage.setItem(key, value); };
  return <div className="space-y-4">
    <div className="rounded-xl border border-border bg-card p-4"><h3 className="font-semibold">Single-task delivery</h3><p className="text-sm text-muted-foreground">Agreement → Works → Completion · One task total, no RIBA stages</p>
      <div className="mt-3 flex flex-wrap gap-4 text-sm"><span>Current phase: {active === 'agreement' ? 'Agreement' : active === 'works' ? 'Works' : 'Completion'}</span><span>Start: {formatDate(savedDelivery?.contract_start)}</span><span>Completion: {formatDate(savedDelivery?.pc_achieved || savedDelivery?.forecast_pc)}</span>{current && <span>Recorded task total: {formatCurrency(taskProposalTotal(current))}</span>}</div>
    </div>
    <nav aria-label="Single-task phases" className="flex flex-wrap gap-2">{['agreement', 'works', 'completion'].map((value, index) => <Button key={value} variant={phase === value ? 'default' : 'outline'} onClick={() => select(value)} aria-pressed={phase === value}>{index + 1} · {value === 'agreement' ? 'Agreement' : value === 'works' ? 'Works' : 'Completion'}</Button>)}</nav>
    <div hidden={phase !== 'agreement'} className="space-y-4"><div className="rounded-xl border border-border bg-card p-4"><p className="text-sm">Single-task agreement: {agreement?.executed === 'yes' ? 'Executed' : 'Awaiting execution'}{agreement?.date_of_execution ? ` · ${formatDate(agreement.date_of_execution)}` : ''}</p><Link to={`/projects/${project.id}?tab=drafting`} className="text-sm text-primary underline">Manage agreement</Link></div><SingleTaskProgressForm phase="agreement" delivery={delivery} setField={setField} onSave={onSave} saving={saving} />{fees}</div>
    {visited.has('works') && <div hidden={phase !== 'works'} className="space-y-4"><SingleTaskProgressForm phase="works" delivery={delivery} setField={setField} onSave={onSave} saving={saving} />{registers}</div>}
    {visited.has('completion') && <div hidden={phase !== 'completion'} className="space-y-4"><SingleTaskProgressForm phase="completion" delivery={delivery} setField={setField} onSave={onSave} saving={saving} />{handover}</div>}
  </div>;
}