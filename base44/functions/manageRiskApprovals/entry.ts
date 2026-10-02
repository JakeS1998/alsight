import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { approvalSummary, canIssue, fail, packetPublic, loadSnapshot } from '../../shared/riskApprovalData.ts';
import { issueRiskApproval } from '../../shared/riskApprovalIssue.ts';
import { recipientAction } from '../../shared/riskApprovalVerify.ts';
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req); const user = await base44.auth.me();
    if (!user || !(await base44.auth.isAuthenticated())) return Response.json({ error: 'Please sign in with your registered portal account.' }, { status: 401 });
    const input = await req.json(); const db = base44.asServiceRole.entities;
    if (!['status','recipients','issue','review','send_code','verify','accept','reject','withdraw','retry','history','snapshot'].includes(input.action)) fail('Unknown approval action.');
    if (['status','recipients','issue','history'].includes(input.action)) {
      if (typeof input.project_id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(input.project_id)) fail('Choose a project.');
      const project = await base44.entities.Project.get(input.project_id);
      if (!project) fail('This project is not accessible.', 403);
      const editable = canIssue(user, project);
      if (input.action === 'status') {
        const summary = await approvalSummary(db, project.id);
        const legacy = await base44.entities.RiskRegisterApproval.filter({ project_id: project.id }, { limit: 4 });
        return Response.json({ ...summary, can_issue: editable, legacy: legacy.items });
      }
      if (!editable) fail('Only the assigned BDM, an administrator or a director can manage approval issues.', 403);
      if (input.action === 'history') {
        if (input.cursor != null && (typeof input.cursor !== 'string' || input.cursor.length > 2000)) fail('Invalid page.');
        const page = await db.RiskApprovalPacket.filter({ project_id: project.id }, { limit: 10, sort: '-created_date', ...(input.cursor ? { cursor: input.cursor } : {}) });
        return Response.json({ ...page, items: page.items.map(packetPublic) });
      }
      if (input.action === 'recipients') {
        if (typeof input.search !== 'string' || input.search.length < 2 || input.search.length > 100) return Response.json({ items: [] });
        const escaped = input.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const users = await db.User.filter({ $and: [{ email: { $ne: 'jakesavage31@gmail.com' } }, { $or: [{ full_name: { $regex: escaped, $options: 'i' } }, { email: { $regex: escaped, $options: 'i' } }] }] }, 'full_name', 20);
        return Response.json({ items: users.map(person => ({ id: person.id, name: person.full_name || person.email, email: person.email })) });
      }
      return Response.json(await issueRiskApproval(base44, user, project, input));
    }
    if (typeof input.packet_id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(input.packet_id)) fail('Choose an issued register.');
    const packet = await db.RiskApprovalPacket.get(input.packet_id);
    if (!packet) fail('Approval issue not found.', 404);
    if (['withdraw','retry','snapshot'].includes(input.action)) {
      const project = await base44.entities.Project.get(packet.project_id);
      if (!project || !canIssue(user, project)) fail('You cannot manage this approval issue.', 403);
      if (input.action === 'snapshot') return Response.json({ snapshot: await loadSnapshot(base44, packet) });
      if (packet.status !== 'active') fail('This issue is no longer active.', 409);
      if (input.action === 'withdraw') {
        await db.RiskApprovalPacket.updateMany({ id: packet.id, status: 'active', current_index: packet.current_index }, { $set: { status: 'withdrawn', withdrawn_by: user.full_name || user.email, withdrawn_at: new Date().toISOString() } });
      } else {
        if (packet.notification_status !== 'failed') fail('Only failed invitations can be retried.');
        await db.RiskApprovalPacket.update(packet.id, { notification_status: 'pending' });
      }
      return Response.json({ ok: true });
    }
    if (!packet.steps.some(step => step.user_id === user.id && step.email.toLowerCase() === user.email.toLowerCase())) fail('Sign in as the named recipient to review this issue.', 403);
    if (input.action === 'review') {
      const summary = await approvalSummary(db, packet.project_id);
      const accepted = packet.steps.some(step => step.user_id === user.id && step.status === 'accepted');
      return Response.json({ packet: packetPublic(packet), stale: summary.packet?.id !== packet.id || summary.stale, is_current: packet.status === 'active' && packet.steps[packet.current_index]?.user_id === user.id, ...(accepted ? { snapshot: await loadSnapshot(base44, packet) } : {}) });
    }
    return Response.json(await recipientAction(base44, user, packet, input));
  } catch (error) { console.error('Risk approval operation failed', error.message); return Response.json({ error: error.status ? error.message : 'Unable to process the approval. Please try again.' }, { status: error.status || 500 }); }
}