import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const actor = await base44.auth.me();
    if (!actor) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (actor.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { employeeId, managerId } = await req.json();
    if (typeof employeeId !== 'string' || !employeeId || typeof managerId !== 'string' || employeeId === managerId) return Response.json({ error: 'Choose a staff member and a different manager.' }, { status: 400 });
    const employee = await base44.entities.User.get(employeeId);
    const manager = managerId ? await base44.entities.User.get(managerId) : null;
    const internal = ['admin', 'director', 'regional_director', 'bsm', 'finance', 'bdm'];
    if (!employee || !internal.includes(employee.role) || (managerId && (!manager || !internal.includes(manager.role)))) return Response.json({ error: 'Both people must be internal staff.' }, { status: 400 });
    const next = managerId || '';
    await base44.asServiceRole.entities.User.update(employeeId, { line_manager_id: next });
    for (const name of ['Opportunity', 'CRMTask', 'CRMActivity', 'Conversation', 'CRMProjectLink']) {
      const entity = base44.asServiceRole.entities[name];
      let result;
      do {
        result = await entity.updateMany({ owner_id: employeeId, line_manager_id: { $ne: next } }, { $set: { line_manager_id: next } });
      } while (result.has_more);
    }
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to assign manager.' }, { status: 500 });
  }
}