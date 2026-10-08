import { flowSpecs } from './dataverseFlowFields.ts';
import { flowReferenceUsers } from './dataverseStaffReferences.ts';
export async function resolveFlowStaffReferences(base44, table, values, context) {
  const fields = table === 'users' ? [] : Object.keys(flowSpecs[table].fields).filter(key => key.endsWith('_aad_id'));
  const ids = [...new Set(values.flatMap(value => fields.map(field => value?.[field]).filter(Boolean).map(id => id.toLowerCase())))];
  if (!ids.length) return values.map(value => ({ value }));
  const { users, identities } = await flowReferenceUsers(base44, ids, context);
  return values.map(value => {
    if (!value) return { value };
    const resolved = { ...value };
    for (const field of fields) {
      if (!value[field]) continue;
      const id = value[field].toLowerCase(), identity = identities.find(u => u.systemuserid?.toLowerCase() === id);
      const matches = users.filter(user => [user.id, user.dataverse_systemuser_id, user.staff_aad_id].some(v => v?.toLowerCase() === id) || (identity?.internalemailaddress && user.email?.trim().toLowerCase() === identity.internalemailaddress.trim().toLowerCase()));
      if (matches.length > 1) return { value: null, error: `Staff reference for ${field} matches multiple ALSight users.` };
      resolved[field] = matches.length ? matches[0].id : identity?.azureactivedirectoryobjectid?.toLowerCase() || id;
    }
    return { value: resolved };
  });
}