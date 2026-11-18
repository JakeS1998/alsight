import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { internalRoles } from '../../shared/allianceLayerAccess.ts';
import { briefingClock, briefingIsDue } from '../../shared/personalBriefingClock.ts';
import { personalBriefingContent } from '../../shared/personalBriefingContent.ts';

const lookup = (entity,id) => entity.get(id).catch(error => error.status === 404 ? null : Promise.reject(error));

async function enqueue(db, now) {
  let cursor, queued = 0, failed = 0;
  do {
    const page = await db.PersonalBriefingSchedule.filter({enabled:true},{limit:50,sort:'id',...(cursor ? {cursor} : {})});
    const due = page.items.flatMap(schedule => {
      const day = briefingIsDue(schedule,now);
      return day ? [{schedule,day}] : [];
    });
    for (let index = 0; index < due.length; index += 5) {
      const results = await Promise.allSettled(due.slice(index,index+5).map(async ({schedule,day}) => {
        const claimed = await db.PersonalBriefingSchedule.updateMany({id:schedule.id,enabled:true,revision:schedule.revision,last_day:{$ne:day}},{$set:{last_day:day}});
        if (!claimed.updated) return;
        try {
          await db.PersonalBriefingDelivery.create({schedule_id:schedule.id,revision:schedule.revision,day,status:'queued'});
          queued++;
        } catch (error) {
          // Leave the claim in place: a lost create response could otherwise cause a duplicate email.
          throw error;
        }
      }));
      failed += results.filter(result => result.status === 'rejected').length;
    }
    cursor = page.has_more ? page.next_cursor : null;
  } while (cursor);
  return {queued,failed};
}

async function prepare(db, delivery) {
  const skip = async () => {
    await db.PersonalBriefingDelivery.updateMany({id:delivery.id,status:'queued'},{$set:{status:'skipped'}});
    return {send:false};
  };
  const schedule = await lookup(db.PersonalBriefingSchedule,delivery.schedule_id);
  if (!schedule?.enabled || schedule.revision !== delivery.revision || briefingClock(new Date(),schedule.timezone).day !== delivery.day) return await skip();
  const recipient = await lookup(db.User,schedule.user_id);
  if (!recipient?.email || !internalRoles.includes(recipient.role)) return await skip();
  const priorities = await personalBriefingContent(db,recipient,schedule,delivery.day);
  // Recheck before claiming, so a pause or schedule edit cancels work already queued.
  const latest = await lookup(db.PersonalBriefingSchedule,schedule.id);
  if (!latest?.enabled || latest.revision !== delivery.revision) return await skip();
  const claim = await db.PersonalBriefingDelivery.updateMany({id:delivery.id,status:'queued'},{$set:{status:'sending'}});
  if (!claim.updated) return {send:false};
  const issueDate = new Intl.DateTimeFormat('en-GB',{timeZone:schedule.timezone,dateStyle:'full'}).format(new Date());
  return {send:true,to:recipient.email,issue_date:issueDate,priorities};
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(error => error.status === 401 ? null : Promise.reject(error));
    if (!user) return Response.json({error:'Sign in to run briefing delivery.'},{status:401});
    if (user.role !== 'admin') return Response.json({error:'Only administrators can run briefing delivery.'},{status:403});
    const input = await req.json().catch(() => null), db = base44.asServiceRole.entities;
    if (input?.action === 'enqueue') return Response.json(await enqueue(db,new Date()));
    if (!['prepare','record'].includes(input?.action) || typeof input.deliveryId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(input.deliveryId) || (input.action === 'record' && typeof input.sent !== 'boolean')) return Response.json({error:'Invalid briefing delivery operation.'},{status:400});
    if (input.action === 'record') {
      await db.PersonalBriefingDelivery.updateMany({id:input.deliveryId,status:'sending'},{$set:{status:input.sent ? 'sent' : 'unconfirmed'}});
      return Response.json({success:true});
    }
    const delivery = await lookup(db.PersonalBriefingDelivery,input.deliveryId);
    return Response.json(delivery?.status === 'queued' ? await prepare(db,delivery) : {send:false});
  } catch {
    return Response.json({error:'Could not process personal briefing delivery.'},{status:500});
  }
}