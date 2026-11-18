import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { internalRoles } from '../../shared/allianceLayerAccess.ts';
import { briefingZone, defaultBriefingZone, validBriefingTime } from '../../shared/personalBriefingClock.ts';

function status(schedule) {
  return { success:true, enabled:schedule?.enabled === true, time:schedule?.time ?? null, timezone:schedule?.timezone ?? defaultBriefingZone, frequency:schedule?.frequency ?? 'daily', includes:'Directly assigned ALS Hub tasks', outlookMeetings:false };
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(error => error.status === 401 ? null : Promise.reject(error));
    if (!user) return Response.json({error:'Sign in to manage your daily briefing.'},{status:401});
    if (!internalRoles.includes(user.role) || !user.email) return Response.json({error:'Personal briefings are available to internal ALS Hub users.'},{status:403});
    const input = await req.json().catch(() => null);
    if (!['status','save','pause'].includes(input?.action)) return Response.json({error:'Choose status, save or pause.'},{status:400});
    const schedules = base44.asServiceRole.entities.PersonalBriefingSchedule;
    const current = (await schedules.filter({user_id:user.id},{limit:1})).items[0];
    if (input.action === 'status') return Response.json(status(current));
    if (input.action === 'pause') {
      if (current?.enabled) await schedules.update(current.id,{enabled:false,revision:crypto.randomUUID()});
      return Response.json(status(current ? {...current,enabled:false} : null));
    }
    const timezone = briefingZone(input.timezone ?? current?.timezone ?? defaultBriefingZone);
    const frequency = input.frequency ?? current?.frequency ?? 'daily';
    const time = input.time ?? current?.time;
    if (!timezone || !validBriefingTime(time) || !['daily','weekdays'].includes(frequency)) return Response.json({error:'Choose a valid timezone, daily or weekdays, and a time on a five-minute boundary.'},{status:400});
    if (current?.enabled && current.time === time && current.timezone === timezone && current.frequency === frequency) return Response.json(status(current));
    const settings = {enabled:true,timezone,frequency,time,revision:crypto.randomUUID()};
    if (current) await schedules.update(current.id,settings);
    else await schedules.upsert([{user_id:user.id,...settings}],{key:'user_id'});
    return Response.json(status(settings));
  } catch {
    return Response.json({error:'Could not manage your personal briefing. Try again shortly.'},{status:500});
  }
}