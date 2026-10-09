export async function deliverApprovalDigest(base44, delivery, recipient, report) {
  const db = base44.asServiceRole.entities.ApprovalDigestDelivery;
  if (report.variables.approval_rows.length > 1000000) throw new Error('This approval summary exceeds the email size limit.');
  const claimed = await db.updateMany({ id: delivery.id, status: 'queued' }, { $set: { status: 'sending', send_error: '' } });
  if (!claimed.updated) return { sent: false, reason: 'Delivery already claimed or completed.' };
  try {
    const result = await base44.asServiceRole.integrations.Core.SendEmail({
      to: recipient.email,
      template_name: 'DailyApprovalDigest',
      variables: report.variables,
    });
    if (result?.sent === false || result?.success === false || result?.dry_run === true) throw new Error('The email service did not confirm sending this digest.');
  } catch (error) {
    await db.update(delivery.id, { status: 'failed', send_error: String(error.message || 'Email sending failed.').slice(0, 1000) });
    throw error;
  }
  // If recording fails after the service accepts the email, retain 'sending': never automatically send it twice.
  await db.update(delivery.id, { status: 'sent', sent_at: new Date().toISOString(), send_error: '' });
  return { sent: true, approval_count: report.count };
}