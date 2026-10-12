import { flowRequest } from './dataverseFlowApi.ts';
import { isGuid } from './dataverseFlowFields.ts';
export async function projectCreateReference(base44, context, mapping, value) {
  const target = mapping.lookupTarget?.entity;
  if (target === 'systemuser') {
    const db = base44.asServiceRole.entities;
    const users = isGuid(value) ? await db.User.filter({ $or: [{ staff_aad_id: value }, { dataverse_systemuser_id: value }] }) : [await db.User.get(value)];
    if (users.length > 1) throw new Error(`Ambiguous staff assignment for ${mapping.local}.`);
    const person = users[0];
    if (isGuid(person?.dataverse_systemuser_id)) return person.dataverse_systemuser_id;
    const aad = person?.staff_aad_id || (isGuid(value) ? value : '');
    const conditions = [isGuid(aad) ? `azureactivedirectoryobjectid eq ${aad} or systemuserid eq ${aad}` : '', person?.email ? `internalemailaddress eq '${person.email.replaceAll("'", "''")}'` : ''].filter(Boolean);
    if (!conditions.length) throw new Error(`The selected ${mapping.local} has no Microsoft identity.`);
    const result = await flowRequest(context.environment, context.token, `systemusers?$select=systemuserid&$filter=${encodeURIComponent(`isdisabled eq false and (${conditions.join(' or ')})`)}&$top=2`);
    if (result.value?.length !== 1) throw new Error(`The selected ${mapping.local} must match exactly one enabled Dataverse user.`);
    return result.value[0].systemuserid;
  }
  if (isGuid(value)) return value;
  const entity = target === 'account' ? 'Account' : target === 'contact' ? 'Contact' : null;
  if (!entity) throw new Error(`Choose a Dataverse-linked ${mapping.local}.`);
  const record = await base44.entities[entity].get(value);
  if (!isGuid(record?.dataverse_id)) throw new Error(`The selected ${mapping.local} is not linked to Dataverse.`);
  return record.dataverse_id;
}