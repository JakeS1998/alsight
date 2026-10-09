import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { bdmRequestDefaults } from '../../shared/bdmRequestDefaults.ts';
import { resolveStaffReportingLine } from '../../shared/staffReportingIdentity.ts';
import {withPortalUserNames} from '../../shared/portalUserNames.ts';
import {missingFullName} from '../../shared/fullName.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 });
    const payload = await req.json();
    if (payload.action === 'request_defaults') {
      if (!['admin', 'director', 'bdm'].includes(user.role)) return Response.json({ error: 'Project request access required' }, { status: 403 });
      if (typeof payload.bdmId !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(payload.bdmId)) return Response.json({ error: 'Invalid BDM' }, { status: 400 });
      return Response.json(await bdmRequestDefaults(base44, payload.bdmId));
    }
    const { projectId } = payload;
    if (typeof projectId !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(projectId))
      return Response.json({ error: 'Invalid project' }, { status: 400 });
    const project = await base44.entities.Project.get(projectId).catch(() => null);
    if (!project) return Response.json({ error: 'Project not available' }, { status: 404 });
    if (payload.action === 'staff_names') {
      if (user.role === 'supplier') return Response.json({ error: 'Staff names not available' }, { status: 403 });
      const ids = [...new Set([project.bdm_aad_id, project.bsm_aad_id].filter(Boolean))];
      const names = {};
      if (!ids.length) return Response.json({ names });
      const users = await withPortalUserNames(base44.asServiceRole.entities,await base44.asServiceRole.entities.User.filter({ $or: [{ id: { $in: ids } }, { staff_aad_id: { $in: ids } }] }));
      for (const person of users) {
        const name = String(person.full_name || '').trim();
        if (!name || name===missingFullName) continue;
        for (const id of [person.id, person.staff_aad_id, person.data?.staff_aad_id]) {
          if (ids.includes(id)) names[id] = name;
        }
      }
      const unresolved = ids.filter(id => !names[id]);
      if (unresolved.length) {
        const contacts = await base44.asServiceRole.entities.Contact.filter({ aad_id: { $in: unresolved } }, { limit: 10, fields: ['aad_id', 'full_name', 'first_name', 'last_name'] });
        for (const person of contacts.items) {
          const name = String(person.full_name || [person.first_name, person.last_name].filter(Boolean).join(' ')).trim();
          if (name && unresolved.includes(person.aad_id) && !names[person.aad_id]) names[person.aad_id] = name;
        }
      }
      return Response.json({ names });
    }
    if (!project.bdm_aad_id) return Response.json({ managerName: '' });
    const line = await resolveStaffReportingLine(base44.asServiceRole.entities, project.bdm_aad_id);
    return Response.json({ managerName: line?.manager_name || '' });
  } catch (error) {
    console.error('Unable to resolve BDM manager', error);
    const rateLimited = Number(error?.response?.status || error?.status) === 429 || /rate limit|too many requests/i.test(error?.message || '');
    return Response.json({ error: rateLimited ? 'Rate limit exceeded' : 'Unable to load BDM manager' }, { status: rateLimited ? 429 : 500 });
  }
}