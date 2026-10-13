import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const validId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
const address = value => String(value || '').trim().toLowerCase();
const escapeHtml = value => String(value || 'Not recorded').replace(/—/g, ',').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const actor = await base44.auth.me();
    if (!actor) return Response.json({ error: 'Sign in to send approval notifications.' }, { status: 401 });
    if (actor.role !== 'admin') return Response.json({ error: 'Only administrators can send approval notifications.' }, { status: 403 });

    const input = await req.json();
    if (!validId(input.requestId)) return Response.json({ error: 'Choose a valid approval request.' }, { status: 400 });

    const db = base44.asServiceRole.entities;
    const approval = await db.DocumentApprovalRequest.get(input.requestId);
    if (!approval) return Response.json({ error: 'Approval request not found.' }, { status: 404 });

    const eligible = approval.status === 'pending' && !approval.response && approval.source_requires_approval !== false && approval.routing_assigned === true && approval.writeback_status === 'pending' && String(approval.request_key || '').startsWith('live:') && Boolean(address(approval.approver_email));
    if (!eligible) return Response.json({ sent: false, skipped: true, reason: 'Approval request is not eligible for notification.' });

    if (await db.DocumentApprovalEvent.count({ approval_id: approval.id, action: 'Approval email sent' })) return Response.json({ sent: false, skipped: true, reason: 'Notification already sent.' });
    const email = address(approval.approver_email);
    const users = await db.User.filter({ email }, '-created_date', 2);
    const recipients = Array.isArray(users) ? users : users.items;
    if (recipients.length !== 1) return Response.json({ sent: false, skipped: true, reason: 'Assigned approver is not one registered app user.' });
    if (input.dryRun === true) return Response.json({ eligible: true, sent: false, dry_run: true });

    const result = await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      template_name: 'NewApprovalRequest',
      variables: {
        document_title: escapeHtml(approval.document_title || 'Approval document'),
        document_number: escapeHtml(approval.document_number),
        approval_type: approval.source_table === 'dma' ? 'Development agreement' : approval.source_table === 'warranties' ? 'Warranty' : 'Legal document',
        project_name: escapeHtml(approval.project_name || 'Project not recorded'),
        project_number: escapeHtml(approval.project_number),
        client_name: escapeHtml(approval.client_name),
        requester_name: escapeHtml(approval.requested_by_name || 'Approval routing'),
        requested_at: escapeHtml(approval.requested_at),
        reason: escapeHtml(approval.reason || 'Please review the document and record your decision.'),
        approval_url: `https://alsight.base44.app/approvals?approval=${encodeURIComponent(approval.id)}`,
      },
    });
    if (result?.sent === false || result?.success === false || result?.dry_run === true) throw new Error('The email service did not confirm sending this approval notification.');
    const status = String(result?.status || '').toLowerCase();
    if (result?.sent !== true && result?.success !== true && !['sent', 'success'].includes(status)) throw new Error('The email service returned no explicit sending confirmation.');

    await db.DocumentApprovalEvent.create({ approval_id: approval.id, action: 'Approval email sent', actor_id: 'approval-email-workflow', actor_name: 'Approval email workflow', occurred_at: new Date().toISOString(), previous_status: approval.status, new_status: approval.status, integration_result: `Notification accepted for ${email}.` });
    return Response.json({ sent: true });
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to send approval notification.' }, { status: 500 });
  }
}