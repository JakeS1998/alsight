import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import useRiskAcceptance from '@/components/risk-approvals/useRiskAcceptance';
import RiskApprovalTimeline from '@/components/risk-approvals/RiskApprovalTimeline';
import RiskEmailVerification from '@/components/risk-approvals/RiskEmailVerification';
import RiskAcceptanceDecision from '@/components/risk-approvals/RiskAcceptanceDecision';
import RiskSnapshotReview from '@/components/risk-approvals/RiskSnapshotReview';
export default function RiskApprovalReview() {
  const { packetId } = useParams(); const { user } = useAuth();
  const flow = useRiskAcceptance(packetId);
  if (flow.query.isPending) return <main className="p-8" role="status">Loading issued risk register…</main>;
  if (flow.query.error) return <main className="mx-auto max-w-3xl space-y-3 p-8"><h1 className="text-xl font-bold">Approval issue unavailable</h1><p role="alert">{flow.query.error.response?.data?.error || flow.query.error.data?.error || 'Sign in with the email address named in the invitation.'}</p><Link className="underline" to="/account-settings">Manage signed-in account</Link></main>;
  const { packet, stale, is_current: current } = flow.query.data;
  return <main className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
    <header><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">ALSight · Risk register acceptance</p><h1 className="mt-2 text-2xl font-bold">{packet.project_name}</h1><p className="mt-2 text-sm">{packet.reference} · {packet.status}</p><p className="text-xs text-muted-foreground">Signed in as {user?.email} · Issued by {packet.issued_by_name} on {new Date(packet.issued_at).toLocaleString('en-GB')}</p></header>
    <RiskApprovalTimeline packet={packet} />
    {stale && <p role="alert" className="rounded-lg border border-destructive bg-card p-4 text-sm text-destructive">The live register has changed or a newer issue exists. This issue cannot receive further acceptance; contact the BDM for a new issue.</p>}
    {!current && <p className="rounded-lg border bg-muted p-4 text-sm">{packet.status === 'active' ? 'This issue is awaiting another party. You will receive an invitation when it is your turn.' : 'This issue is closed to further decisions.'}</p>}
    {flow.message && <p role="status" className="text-sm font-medium">{flow.message}</p>}
    {flow.action.error && <p role="alert" className="text-sm text-destructive">{flow.action.error}</p>}
    {current && !stale && !flow.session && <RiskEmailVerification action={flow.action} challengeId={flow.challengeId} onSend={flow.send} onVerify={flow.verify} />}
    {(flow.snapshot || flow.query.data.snapshot) && <RiskSnapshotReview snapshot={flow.snapshot || flow.query.data.snapshot} packetId={packetId} challengeId={flow.challengeId} session={flow.session} canComment={current && !stale && !!flow.session} />}
    {current && !stale && flow.session && <RiskAcceptanceDecision reference={packet.reference} busy={flow.action.busy} onDecision={flow.decide} sequential={packet.steps.length > 1} />}
    <p className="break-all text-xs text-muted-foreground">Version integrity reference: {packet.snapshot_hash}. This workflow records explicit acceptance; it is not a qualified electronic signature.</p>
  </main>;
}