import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { approvalDigestContent, approvalDigestDay, pendingDigestQuery } from '../../shared/approvalDigestContent.ts';
import { deliverApprovalDigest } from '../../shared/approvalDigestDelivery.ts';
const address = value => String(value || '').trim().toLowerCase();
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req), actor = await base44.auth.me();
    if (!actor) return Response.json({error:'Sign in to manage approval reminders.'},{status:401});
    if (actor.role !== 'admin') return Response.json({error:'Only administrators can prepare approval reminders.'},{status:403});
    const input = await req.json(), db = base44.asServiceRole.entities, day = approvalDigestDay();
    if (['enqueue','preview'].includes(input.action)) {
      let cursor, eligible = 0, created = 0, alreadyQueued = 0, preview = null;
      do {
        const page = await db.DocumentApprovalRequest.filter(pendingDigestQuery,{distinct:'approver_email',limit:100,...(cursor ? {cursor} : {})});
        for (let index = 0; index < page.items.length; index += 5) {
          await Promise.all(page.items.slice(index,index+5).map(async value => {
            const email = address(value);
            if (!email || !(await db.ApprovalAccess.count({email,enabled:true}))) return;
            const pattern = '^'+email.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$';
            const found = await db.User.filter({email:{$regex:pattern,$options:'i'}},'-created_date',2);
            const users = Array.isArray(found) ? found : found.items;
            if (users.length !== 1) return;
            const recipient = users[0];
            eligible++;
            if (input.action === 'preview') {
              const report = await approvalDigestContent(base44,recipient);
              if (report.count && !preview) preview = {recipient_email:recipient.email,...report};
              return;
            }
            const key = `${day}:${recipient.id}`;
            if ((await db.ApprovalDigestDelivery.filter({delivery_key:key},{limit:1})).items.length) { alreadyQueued++; return; }
            // Single create is intentional: every recipient needs its own email workflow trigger.
            await db.ApprovalDigestDelivery.create({delivery_key:key,report_day:day,recipient_user_id:recipient.id,recipient_email:address(recipient.email),status:'queued'});
            created++;
          }));
        }
        cursor = page.has_more ? page.next_cursor : null;
      } while (cursor);
      return Response.json({report_day:day,eligible_recipients:eligible,queued:created,already_queued:alreadyQueued,...(input.action === 'preview' ? {preview} : {})});
    }
    if (!['digest','deliver'].includes(input.action) || typeof input.deliveryId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(input.deliveryId)) return Response.json({error:'Choose a valid reminder operation.'},{status:400});
    const delivery = await db.ApprovalDigestDelivery.get(input.deliveryId);
    if (!delivery) return Response.json({error:'Reminder not found.'},{status:404});
    if (delivery.status !== 'queued') return Response.json({send:false,sent:false,status:delivery.status});
    const recipient = await db.User.get(delivery.recipient_user_id);
    if (!recipient || address(recipient.email) !== delivery.recipient_email || delivery.report_day !== day || !(await db.ApprovalAccess.count({email:delivery.recipient_email,enabled:true}))) {
      await db.ApprovalDigestDelivery.update(delivery.id,{status:'skipped'});
      return Response.json({send:false});
    }
    const report = await approvalDigestContent(base44,recipient);
    await db.ApprovalDigestDelivery.updateMany({id:delivery.id,status:'queued'},{$set:{approval_count:report.count,...(!report.count ? {status:'skipped'} : {})}});
    if (input.action === 'deliver') return Response.json(report.count ? await deliverApprovalDigest(base44,delivery,recipient,report) : {sent:false,send:false});
    return Response.json(report.count ? {send:true,to:recipient.email,variables:report.variables} : {send:false});
  } catch (error) { return Response.json({error:error.message || 'Could not prepare approval reminders.'},{status:500}); }
}