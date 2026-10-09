import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { withPortalUserNames } from '../../shared/portalUserNames.ts';
import {portalNameAliases} from '../../shared/portalNameAliases.ts';

const ROLES = ['admin', 'director', 'regional_director', 'bsm', 'finance', 'bdm', 'client', 'supplier', 'project_manager', 'framework_stakeholder'];

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const email = (user.email || '').trim().toLowerCase();
    if (!email) return Response.json({ applied: false });
    const [namedUsers, pending] = await Promise.all([
      withPortalUserNames(base44.asServiceRole.entities, [user]),
      base44.asServiceRole.entities.PendingPortalAccess.filter({ email }, '-created_date', 2),
    ]);
    const displayName = namedUsers[0]?.full_name || 'Full name not recorded';
    const nameAliases=await portalNameAliases(base44,user);
    if (!pending.length) return Response.json({ applied: false, displayName,nameAliases });
    if (pending.length > 1) return Response.json({ error: 'Multiple access assignments exist for this email. Contact an administrator.' }, { status: 409 });
    const assignment = pending[0];
    if (!ROLES.includes(assignment.portal_role)) return Response.json({ error: 'Invalid pending access role' }, { status: 400 });

    const contact = await base44.asServiceRole.entities.Contact.get(assignment.contact_id);
    const supplierAccounts = assignment.portal_role === 'supplier' && assignment.account_id
      ? await base44.asServiceRole.entities.Account.filter({ dataverse_id: assignment.account_id }, '-created_date', 1)
      : [];
    await base44.asServiceRole.entities.User.update(user.id, {
      contact_dataverse_id: assignment.portal_role === 'project_manager' && contact?.email?.trim().toLowerCase() === email ? (contact.dataverse_id || null) : null,
      role: assignment.portal_role,
      staff_aad_id: assignment.staff_aad_id || null,
      delegate_of: null,
      delegate_of_name: null,
      delegate_region: null,
      account_id: assignment.account_id || null,
      company_number: supplierAccounts[0]?.company_number || null,
      region: assignment.portal_role === 'regional_director' ? (assignment.region || null) : null,
    });
    if (contact?.email?.trim().toLowerCase() === email) {
      await base44.asServiceRole.entities.Contact.update(contact.id, { aad_id: user.id, portal_role: assignment.portal_role });
    }
    await base44.asServiceRole.entities.PendingPortalAccess.delete(assignment.id);
    return Response.json({ applied: true, displayName,nameAliases });
  } catch (error) {
    console.error('Failed to apply pending portal access', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}