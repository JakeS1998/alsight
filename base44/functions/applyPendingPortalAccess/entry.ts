import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

const ROLES = ['admin', 'director', 'regional_director', 'bsm', 'finance', 'bdm', 'client', 'supplier', 'project_manager'];

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const email = (user.email || '').trim().toLowerCase();
    if (!email) return Response.json({ applied: false });
    const pending = await base44.asServiceRole.entities.PendingPortalAccess.filter({ email }, '-created_date', 2);
    if (!pending.length) return Response.json({ applied: false });
    if (pending.length > 1) return Response.json({ error: 'Multiple access assignments exist for this email. Contact an administrator.' }, { status: 409 });
    const assignment = pending[0];
    if (!ROLES.includes(assignment.portal_role)) return Response.json({ error: 'Invalid pending access role' }, { status: 400 });

    const contact = await base44.asServiceRole.entities.Contact.get(assignment.contact_id);
    await base44.asServiceRole.entities.User.update(user.id, {
      contact_dataverse_id: assignment.portal_role === 'project_manager' && contact?.email?.trim().toLowerCase() === email ? (contact.dataverse_id || null) : null,
      role: assignment.portal_role,
      account_id: assignment.account_id || null,
      region: assignment.portal_role === 'regional_director' ? (assignment.region || null) : null,
    });
    if (contact?.email?.trim().toLowerCase() === email) {
      await base44.asServiceRole.entities.Contact.update(contact.id, { aad_id: user.id, portal_role: assignment.portal_role });
    }
    await base44.asServiceRole.entities.PendingPortalAccess.delete(assignment.id);
    return Response.json({ applied: true });
  } catch (error) {
    console.error('Failed to apply pending portal access', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}