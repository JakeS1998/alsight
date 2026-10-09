export async function deliverApprovalDigest(base44, delivery, recipient, report) {
  const db = base44.asServiceRole.entities.ApprovalDigestDelivery;
  if (report.variables.approval_rows.length > 1000000) throw new Error('This approval summary exceeds the email size limit.');
  const claimed = await db.updateMany({ id: delivery.id, status: 'queued' }, { $set: { status: 'sending', send_error: '' } });
  if (!claimed.updated) return { sent: false, reason: 'Delivery already claimed or completed.' };
  let receipt;
  try {
    console.info('Approval digest: submitting email', { delivery_id: delivery.id });
    const result = await base44.asServiceRole.integrations.Core.SendEmail({
      to: recipient.email,
      template_name: 'DailyApprovalDigest',
      variables: report.variables,
    });
    receipt = { result_type: result === null ? 'null' : typeof result };
    if (result && typeof result === 'object') {
      receipt.response_keys = Object.keys(result).slice(0, 20).map(key => key.slice(0, 80));
      for (const key of ['sent', 'success', 'dry_run', 'status', 'message_id', 'id']) {
        if (typeof result[key] === 'boolean') receipt[key] = result[key];
        else if (typeof result[key] === 'string') receipt[key] = result[key].slice(0, 200);
      }
    }
    console.info('Approval digest: email-service response', { delivery_id: delivery.id, ...receipt });
    await db.update(delivery.id, { service_response: JSON.stringify(receipt) });
    if (result?.sent === false || result?.success === false || result?.dry_run === true) throw new Error('The email service did not confirm sending this digest.');
    const status = typeof result?.status === 'string' ? result.status.toLowerCase() : '';
    if (result?.sent !== true && result?.success !== true && !['sent', 'success'].includes(status)) {
      await db.update(delivery.id, { status: 'unconfirmed', send_error: 'The email service returned no explicit sending confirmation. Do not automatically resend.' });
      return { sent: false, status: 'unconfirmed', service_response: receipt, approval_count: report.count };
    }
  } catch (error) {
    console.error('Approval digest: sending failed', { delivery_id: delivery.id });
    await db.update(delivery.id, { status: 'failed', send_error: String(error.message || 'Email sending failed.').slice(0, 1000) });
    throw error;
  }
  // Service acceptance is not an inbox delivery receipt; never automatically repeat an uncertain attempt.
  await db.update(delivery.id, { status: 'sent', sent_at: new Date().toISOString(), send_error: '' });
  return { sent: true, service_response: receipt, approval_count: report.count };
}