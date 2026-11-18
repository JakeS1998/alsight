import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { digestAddress, formatDigestDay, microsoftApprovalDigest } from '../../shared/microsoftApprovalDigest.ts';
import { dataverseEnvironment } from '../../shared/dataverseConnection.ts';
import { dataverseRoles } from '../../shared/dataverseUserAuth.ts';
import { microsoftSyncPause } from '../../shared/coMicrosoftPause.ts';
import { deliverApprovalDigest } from '../../shared/approvalDigestDelivery.ts';

const getRecord = (entity, id) => entity.get(id).catch(error => Number(error.status ?? error.response?.status) === 404 ? null : Promise.reject(error));
async function queueReminders(db, day, preview) {
  const config = (await db.DataverseConnection.filter({key:'primary'}, {limit:1})).items[0];
  if (!config) return { queued:0, eligible:0, reason:'Dataverse is not configured.' };
  const environment = dataverseEnvironment(config.environment_url);
  let cursor, queued = 0, eligible = 0;
  do {
    const page = await db.DataverseUserConnection.filter({ environment_url:environment,status:'connected' }, { sort:'id',limit:50,fields:['user_id'],...(cursor ? {cursor} : {}) });
    for (let i = 0; i < page.items.length; i += 3) await Promise.all(page.items.slice(i, i + 3).map(async connection => {
      const recipient = await getRecord(db.User, connection.user_id), email = digestAddress(recipient?.email);
      if (!email || !dataverseRoles.includes(recipient.role) || !(await db.ApprovalAccess.count({email,enabled:true}))) return;
      eligible++;
      if (preview) return;
      const key = `${day}:${recipient.id}`;
      if ((await db.ApprovalDigestDelivery.filter({delivery_key:key},{limit:1})).items.length) return;
      // One create event per recipient initiates a separate, private email workflow.
      await db.ApprovalDigestDelivery.create({delivery_key:key,report_day:day,recipient_user_id:recipient.id,recipient_email:email,status:'queued'});
      queued++;
    }));
    cursor = page.has_more ? page.next_cursor : null;
  } while (cursor);
  return { queued, eligible };
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const actor = await base44.auth.me().catch(error => Number(error.status ?? error.response?.status) === 401 ? null : Promise.reject(error));
    if (!actor) return Response.json({error:'Sign in to manage approval reminders.'},{status:401});
    if (actor.role !== 'admin') return Response.json({error:'Only administrators can manage approval reminders.'},{status:403});
    const input = await req.json().catch(() => null), db = base44.asServiceRole.entities, day = formatDigestDay();
    if (input?.action === 'testSelf') {
      if (await microsoftSyncPause(base44)) return Response.json({sent:false,reason:'Microsoft access is paused for contingency. No email sent.'});
      const email = digestAddress(actor.email);
      if (!email || !(await db.ApprovalAccess.count({email,enabled:true}))) return Response.json({error:'Your account needs Approval Centre access before you can send a test.'},{status:403});
      const testAttempts = await db.ApprovalDigestDelivery.count({recipient_user_id:actor.id,report_day:day,delivery_key:{$regex:'^test:'}});
      if (testAttempts >= 10) return Response.json({error:'You’ve reached the limit of 10 test digests today. You can send more tomorrow.'},{status:429});
      const deliveryKey = `test:${day}:${actor.id}:${crypto.randomUUID()}`;
      const report = await microsoftApprovalDigest(base44,actor);
      if (!report) return Response.json({sent:false,reason:'No test email sent. Check that your matching work Dataverse account is connected and has an outstanding approval assigned to you.'});
      const delivery = await db.ApprovalDigestDelivery.create({delivery_key:deliveryKey,report_day:day,recipient_user_id:actor.id,recipient_email:email,status:'skipped',approval_count:report.count});
      const {sent} = await deliverApprovalDigest(base44,delivery,actor,report);
      return Response.json({sent});
    }
    if (['enqueue','preview'].includes(input?.action)) {
      if (await microsoftSyncPause(base44)) return Response.json({queued:0,reason:'Microsoft access is paused for contingency.'});
      return Response.json({report_day:day,...await queueReminders(db,day,input.action === 'preview')});
    }
    if (!['digest','record'].includes(input?.action) || typeof input.deliveryId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(input.deliveryId) || (input.action === 'record' && typeof input.sent !== 'boolean')) return Response.json({error:'Choose a valid reminder operation.'},{status:400});
    if (input.action === 'record') {
      const sent = input.sent;
      await db.ApprovalDigestDelivery.updateMany({id:input.deliveryId,status:'sending'},{$set:sent ? {status:'sent',sent_at:new Date().toISOString()} : {status:'unconfirmed',send_error:'The workflow did not confirm sending this reminder.'}});
      return Response.json({sent});
    }
    const delivery = await getRecord(db.ApprovalDigestDelivery,input.deliveryId);
    if (!delivery) return Response.json({error:'Reminder not found.'},{status:404});
    if (delivery.status !== 'queued' || delivery.report_day !== day) return Response.json({send:false});
    const skip = async () => {
      await db.ApprovalDigestDelivery.updateMany({id:delivery.id,status:'queued'},{$set:{status:'skipped'}});
      return Response.json({send:false});
    };
    const recipient = await getRecord(db.User,delivery.recipient_user_id);
    if (!recipient || digestAddress(recipient.email) !== delivery.recipient_email || !(await db.ApprovalAccess.count({email:delivery.recipient_email,enabled:true})) || await microsoftSyncPause(base44)) return await skip();
    let report;
    try { report = await microsoftApprovalDigest(base44,recipient); }
    catch {
      await db.ApprovalDigestDelivery.updateMany({id:delivery.id,status:'queued'},{$set:{status:'failed',send_error:'Could not read assigned approvals from the recipient’s Microsoft connection.'}});
      return Response.json({error:'Could not read pending Microsoft approvals.'},{status:502});
    }
    if (!report) return await skip();
    const claimed = await db.ApprovalDigestDelivery.updateMany({id:delivery.id,status:'queued'},{$set:{status:'sending',approval_count:report.count}});
    return Response.json(claimed.updated ? {send:true,to:recipient.email,variables:report.variables} : {send:false});
  } catch (error) { return Response.json({error:error.message || 'Could not prepare approval reminders.'},{status:500}); }
}