import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { RISK_APPROVAL_PARTIES, RISK_APPROVAL_EDITORS } from '@/components/delivery/riskApprovalProgress';
import useRiskRegisterApproval from '@/components/delivery/useRiskRegisterApproval';
import RiskApprovalCard from '@/components/delivery/RiskApprovalCard';
export default function RiskRegisterApprovals({ project }) {
  const { user } = useAuth();
  const review = useRiskRegisterApproval(project.id);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const editable = RISK_APPROVAL_EDITORS.includes(user?.role);
  useEffect(() => { if (review.data) setDraft(Object.fromEntries(RISK_APPROVAL_PARTIES.map(party => [party.key, review.data.approvals.find(row => row.stakeholder === party.key) || { approved: false, approver_name: '' }]))); }, [review.data]);
  const save = async event => {
    event.preventDefault(); setError(''); setSaving(true);
    try {
      if (!review.data?.count) throw new Error('Add risks before recording approvals.');
      if (RISK_APPROVAL_PARTIES.some(party => draft[party.key]?.approved && !draft[party.key]?.approver_name?.trim())) throw new Error('Enter the name of each approving party.');
      await base44.entities.RiskRegisterApproval.upsert(RISK_APPROVAL_PARTIES.map(party => ({ project_id: project.id, client_account_id: project.client_account_id || '', stakeholder: party.key, approved: !!draft[party.key]?.approved, approver_name: draft[party.key]?.approver_name?.trim() || '', recorded_by: user.full_name || user.email, recorded_at: new Date().toISOString() })), { key: ['project_id', 'stakeholder'] });
      await review.refresh();
    } catch (e) { setError(e.message || 'Unable to save approvals.'); }
    finally { setSaving(false); }
  };
  return <form onSubmit={save} className="space-y-4 rounded-xl border border-border bg-muted/40 p-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h4 className="text-sm font-bold">Risk register approvals</h4><p className="mt-1 text-xs text-muted-foreground">Completion requires a populated register and PM, Contractor, Client and ALS approval. Record confirmations received from each party.</p></div><span className="rounded-md bg-card px-3 py-1 text-xs font-bold">{review.progress.percent == null ? '—' : `${review.progress.percent}% complete`}</span></div>
    {review.isPending ? <p role="status" className="text-sm text-muted-foreground">Loading approvals…</p> : review.error ? <p role="alert" className="text-sm text-destructive">Unable to load risk register approvals.</p> : <><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{RISK_APPROVAL_PARTIES.map(party => <RiskApprovalCard key={party.key} party={party} value={draft[party.key] || {}} saved={review.data.approvals.find(row => row.stakeholder === party.key)} onChange={value => setDraft(previous => ({ ...previous, [party.key]: value }))} disabled={saving || !review.data.count} readOnly={!editable} />)}</div><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">{review.progress.detail}. {editable ? 'Delivery editors record these approvals.' : 'Only delivery editors can record approvals.'}</p>{editable && <Button type="submit" size="sm" disabled={saving || !review.data.count}>{saving ? 'Saving…' : 'Save approvals'}</Button>}</div></>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </form>;
}