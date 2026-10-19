import {INTERNAL_ROLES, STAFF_WORKSPACE_ROLES} from '@/lib/portal';
import {IE_ROLES} from '@/components/ie/ieClient';
const portalRoles=[...INTERNAL_ROLES,'client','supplier','project_manager'];
export const WORKSPACE_ACCESS={
 today:[...STAFF_WORKSPACE_ROLES,'client','supplier'],
 alliance360:STAFF_WORKSPACE_ROLES,
 network:[...STAFF_WORKSPACE_ROLES,'client','project_manager'],
 people:STAFF_WORKSPACE_ROLES,
 ie:IE_ROLES,
 opportunities:INTERNAL_ROLES,
 projects:[...portalRoles,'sam_director'],
 commercial:STAFF_WORKSPACE_ROLES,
 approvals:[...portalRoles,'framework_stakeholder'],
 framework:[...INTERNAL_ROLES,'framework_stakeholder'],
 insider:STAFF_WORKSPACE_ROLES,
 account:['client'],
 contacts:['admin'],
 help:[...STAFF_WORKSPACE_ROLES,'client','supplier','project_manager','framework_stakeholder']
};
export function canViewWorkspace(role,workspace){return WORKSPACE_ACCESS[workspace]?.includes(role) || false;}