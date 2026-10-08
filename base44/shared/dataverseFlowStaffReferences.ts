import { flowSpecs } from './dataverseFlowFields.ts';
export async function resolveFlowStaffReferences(base44, table, values) {
  const fields = table === 'users' ? [] : Object.keys(flowSpecs[table].fields).filter(key => key.endsWith('_aad_id'));
  const ids = [...new Set(values.flatMap(value => fields.map(field => value?.[field]).filter(Boolean)))];
  if (!ids.length) return values.map(value => ({ value }));
  const users = await base44.entities.User.filter({ $or: [{ dataverse_systemuser_id: { $in: ids } }, { staff_aad_id: { $in: ids } }] });
  return values.map(value => {
    if (!value) return { value };
    const resolved = { ...value };
    for (const field of fields) {
      if (!value[field]) continue;
      const matches = users.filter(user => [user.dataverse_systemuser_id, user.staff_aad_id].includes(value[field]));
      if (matches.length !== 1) return { value: null, error: `Staff reference for ${field} is not uniquely linked to an existing ALSight user. Review system users first.` };
      resolved[field] = matches[0].id;
    }
    return { value: resolved };
  });
}