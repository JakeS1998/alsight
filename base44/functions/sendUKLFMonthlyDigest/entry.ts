import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { readDigestSettings, digestRecipients } from '../../shared/uklfDigestSettings.ts';
import { uklfPortfolioSummary } from '../../shared/uklfPortfolioSummary.ts';
import { uklfDigestMessage } from '../../shared/uklfDigestMessage.ts';
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Administrator access required.' }, { status: 403 });
    const body = await req.json();
    if (!['preview', 'scheduled'].includes(body.action)) return Response.json({ error: 'Invalid digest operation.' }, { status: 400 });
    const db = base44.entities, now = new Date();
    const settings = await readDigestSettings(db);
    if (!settings.enabled && body.action === 'scheduled') return Response.json({ skipped: 'Monthly emails are paused.' });
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(now).map(part => [part.type, part.value]));
    if (body.action === 'scheduled' && (parts.day !== '01' || Number(parts.hour) < 9)) return Response.json({ skipped: 'Not the monthly UK send window.' });
    const [recipients, summary] = await Promise.all([digestRecipients(db, settings.selected_user_ids || []), uklfPortfolioSummary(db.FrameworkProjectReport)]);
    const message = uklfDigestMessage(summary, now);
    if (body.action === 'preview') return Response.json({ enabled: settings.enabled, recipientCount: recipients.length, summary, subject: message.subject, text: message.text });
    const period = `${parts.year}-${parts.month}`;
    let sent = 0, failed = 0, skipped = 0;
    for (const recipient of recipients) {
      const { records } = await db.UKLFDigestDelivery.upsert([{ delivery_key: `${period}:${recipient.id}`, period, user_id: recipient.id }], { key: 'delivery_key' });
      const delivery = records[0];
      const claim = await db.UKLFDigestDelivery.updateMany({ id: delivery.id, status: 'pending' }, { $set: { status: 'sending' } });
      if (!claim.updated) { skipped++; continue; }
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({ to: recipient.email, from_name: 'ALSight · UK Leisure Framework', ...message });
        await db.UKLFDigestDelivery.update(delivery.id, { status: 'sent', sent_at: new Date().toISOString() });
        sent++;
      } catch (error) {
        await db.UKLFDigestDelivery.update(delivery.id, { status: 'failed', error: String(error.message || 'Email delivery could not be confirmed.').slice(0, 300) });
        failed++;
      }
    }
    const result = recipients.length ? `${sent} sent; ${failed} failed or unconfirmed; ${skipped} previously attempted.` : 'No recipients yet. Invite framework stakeholders or select additional portal users.';
    await db.UKLFDigestSettings.update(settings.id, { last_run_at: now.toISOString(), last_result: result });
    return Response.json({ period, sent, failed, skipped });
  } catch (error) {
    console.error('Monthly UKLF digest unavailable', error);
    return Response.json({ error: 'Unable to prepare or send the monthly digest.' }, { status: 500 });
  }
}