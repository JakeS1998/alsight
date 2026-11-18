import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { internalRoles } from '../../shared/allianceLayerAccess.ts';
import { briefingZone, defaultBriefingZone, validBriefingTime } from '../../shared/personalBriefingClock.ts';

import { availableBriefingSections, selectedBriefingSections } from '../../shared/personalBriefingSections.ts';

function status(schedule,user) {
  const availableSections = availableBriefingSections(user);
  const sections = selectedBriefingSections(schedule,user);
  return { success:true, enabled:schedule?.enabled === true, time:schedule?.time ?? null, timezone:schedule?.timezone ?? defaultBriefingZone, frequency:schedule?.frequency ?? 'daily', sections, availableSections, includes:availableSections.filter(s => sections.includes(s.id)).map(s => s.label).join(', '), outlookMeetings:false };
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(error => error.status === 401 ? null : Promise.reject(error));
    if (!user) return Response.json({error:'Sign in to manage your daily briefing.'},{status:401});
    if (!internalRoles.includes(user.role) || !user.email) return Response.json({error:'Personal briefings are available to internal ALS Hub users.'},{status:403});
    const input = await req.json().catch(() => null);
    if (!['status','save','pause','customise'].includes(input?.action)) return Response.json({error:'Choose status, save, pause or customise.'},{status:400});
    const schedules = base44.asServiceRole.entities.PersonalBriefingSchedule;
    const current = (await schedules.filter({user_id:user.id},{limit:1})).items[0];
    if (input.action === 'status') return Response.json(status(current,user));
    if (input.action === 'pause') {
      if (current?.enabled) await schedules.update(current.id,{enabled:false,revision:crypto.randomUUID()});
      return Response.json(status(current ? {...current,enabled:false} : null,user));
    }
    const available = availableBriefingSections(user).map(s => s.id);
    if ((input.sections !== undefined || input.action === 'customise') && (!Array.isArray(input.sections) || !input.sections.length || input.sections.length > available.length || input.sections.some(id => !available.includes(id)) || new Set(input.sections).size !== input.sections.length)) return Response.json({error:'Choose at least one briefing section available to your account, without duplicates.'},{status:400});
    const sections = input.sections ?? selectedBriefingSections(current,user);
    if (input.action === 'customise') {
      if (!current) return Response.json({error:'Set a briefing time before changing its sections.'},{status:400});
      if (JSON.stringify(current.sections) !== JSON.stringify(sections)) await schedules.update(current.id,{sections,revision:crypto.randomUUID()});
      return Response.json(status({...current,sections},user));
    }
    const timezone = briefingZone(input.timezone ?? current?.timezone ?? defaultBriefingZone);
    const frequency = input.frequency ?? current?.frequency ?? 'daily';
    const time = input.time ?? current?.time;
    if (!timezone || !validBriefingTime(time) || !['daily','weekdays'].includes(frequency)) return Response.json({error:'Choose a valid timezone, daily or weekdays, and a time on a five-minute boundary.'},{status:400});
    if (current?.enabled && current.time === time && current.timezone === timezone && current.frequency === frequency && JSON.stringify(current.sections ?? ['tasks']) === JSON.stringify(sections)) return Response.json(status(current,user));
    const settings = {enabled:true,timezone,frequency,time,sections,revision:crypto.randomUUID()};
    if (current) await schedules.update(current.id,settings);
    else await schedules.upsert([{user_id:user.id,...settings}],{key:'user_id'});
    return Response.json(status(settings,user));
  } catch {
    return Response.json({error:'Could not manage your personal briefing. Try again shortly.'},{status:500});
  }
}