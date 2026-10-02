import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { isStale, riskMetadata, partyLabels } from '../../shared/riskApprovalData.ts';
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req); const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { packet_id } = await req.json();
    if (typeof packet_id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(packet_id)) return Response.json({ error: 'Invalid issue.' }, { status: 400 });
    const db = base44.asServiceRole.entities; const packet = await db.RiskApprovalPacket.get(packet_id);
    if (!packet || packet.status !== 'active' || packet.notification_status !== 'pending') return Response.json({ skipped: true });
    if (isStale(packet, await riskMetadata(db, packet.project_id))) return Response.json({ skipped: true, reason: 'Register changed' });
    const step = packet.steps[packet.current_index];
    if (!step?.user_id) return Response.json({ skipped: true, reason: 'Awaiting recipient assignment' });
    const recipient = await db.User.get(step.user_id);
    if (!recipient || recipient.email.toLowerCase() !== step.email.toLowerCase()) {
      await db.RiskApprovalPacket.update(packet.id, { notification_status: 'failed' });
      return Response.json({ error: 'Named registered recipient is unavailable.' }, { status: 409 });
    }
    const claim = await db.RiskApprovalPacket.updateMany({ id: packet.id, status: 'active', current_index: packet.current_index, notification_status: 'pending' }, { $set: { notification_status: 'sending' } });
    if (!claim.updated) return Response.json({ skipped: true });
    try {
      const link = `https://alsight.base44.app/risk-approvals/${encodeURIComponent(packet.id)}`;
      await base44.asServiceRole.integrations.Core.SendEmail({ to: step.email, subject: `Risk register acceptance required — ${packet.reference}`, from_name: 'ALSight', text: `You are the next ${partyLabels[step.party]} reviewer for ${packet.project_name}.\n\n${packet.issued_by_name} issued the locked register ${packet.reference} on ${packet.issued_at}.\n\nReview it here: ${link}\n\nSign in with this registered email address, request a verification code, then review the full issued register and explicitly accept or decline it. Acceptance invites the next party; declining stops this issue. This is a recorded approval, not an Adobe-style digital signature.` });
      await db.RiskApprovalPacket.updateMany({ id: packet.id, current_index: packet.current_index, notification_status: 'sending' }, { $set: { notification_status: 'sent', notification_index: packet.current_index, notification_at: new Date().toISOString() } });
      return Response.json({ sent: true });
    } catch (error) {
      await db.RiskApprovalPacket.updateMany({ id: packet.id, current_index: packet.current_index, notification_status: 'sending' }, { $set: { notification_status: 'failed' } });
      throw error;
    }
  } catch (error) { console.error('Risk invitation failed', error.message); return Response.json({ error: 'Unable to send the approval invitation.' }, { status: 500 }); }
}