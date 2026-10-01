import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { assignStaffManager } from '../../shared/pipelineManager.ts';
import { syncStaffReporting } from '../../shared/syncStaffReporting.ts';
import { withPortalUserNames } from '../../shared/portalUserNames.ts';
import { portalDirectoryQuery } from '../../shared/portalDirectoryVisibility.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const actor = await base44.auth.me();
    if (!actor) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (actor.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const payload = await req.json();
    const internal = ['admin', 'director', 'regional_director', 'bsm', 'finance', 'bdm'];
    if (payload.action === 'list') {
      const all = await base44.asServiceRole.entities.User.filter({ ...portalDirectoryQuery, role: { $in: internal } });
      const named = await withPortalUserNames(base44.asServiceRole.entities, all);
      return Response.json({ users: named.map(person => ({ id: person.id, full_name: person.full_name, email: person.email, role: person.role, staff_aad_id: person.staff_aad_id || '', line_manager_id: person.line_manager_id || '' })) });
    }
    if (payload.action === 'sync_staff') {
      if (!Array.isArray(payload.lineIds) || !payload.lineIds.length || payload.lineIds.length > 50 || payload.lineIds.some(id => typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(id))) return Response.json({ error: 'Choose up to 50 verified reporting lines.' }, { status: 400 });
      return Response.json(await syncStaffReporting(base44.asServiceRole.entities, [...new Set(payload.lineIds)]));
    }
    const { employeeId, managerId } = payload;
    if (typeof employeeId !== 'string' || !employeeId || typeof managerId !== 'string' || employeeId === managerId) return Response.json({ error: 'Choose a staff member and a different manager.' }, { status: 400 });
    const employee = await base44.asServiceRole.entities.User.get(employeeId);
    const manager = managerId ? await base44.asServiceRole.entities.User.get(managerId) : null;
    if (!employee || !internal.includes(employee.role) || (managerId && (!manager || !internal.includes(manager.role)))) return Response.json({ error: 'Both people must be internal staff.' }, { status: 400 });
    const next = managerId || '';
    await assignStaffManager(base44.asServiceRole.entities, employeeId, next);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to assign manager.' }, { status: 500 });
  }
}