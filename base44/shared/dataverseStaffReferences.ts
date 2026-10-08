import { flowRequest } from './dataverseFlowApi.ts';
import { isGuid } from './dataverseFlowFields.ts';
import { staffEmailQuery } from './staffReportingIdentity.ts';
export async function flowReferenceUsers(base44, ids, context) {
  const users = await base44.entities.User.filter({ $or: [{ dataverse_systemuser_id: { $in: ids } }, { staff_aad_id: { $in: ids } }] });
  const missing = ids.filter(id => !users.some(u => [u.dataverse_systemuser_id, u.staff_aad_id].some(v => v?.toLowerCase() === id)));
  const identities = [];
  if (context) for (let start = 0; start < missing.length; start += 40) {
    const filter = missing.slice(start, start + 40).filter(isGuid).map(id => `systemuserid eq ${id}`).join(' or ');
    if (!filter) continue;
    const data = await flowRequest(context.environment, context.token, `systemusers?$select=systemuserid,azureactivedirectoryobjectid,internalemailaddress&$filter=${encodeURIComponent(filter)}&$top=40`);
    identities.push(...(data.value || []));
  }
  const emails = [...new Set(identities.map(u => u.internalemailaddress?.trim().toLowerCase()).filter(Boolean))];
  if (emails.length) {
    const matched = await base44.entities.User.filter({ $or: emails.map(email => ({ email: staffEmailQuery(email) })) });
    for (const user of matched) if (!users.some(u => u.id === user.id)) users.push(user);
  }
  return { users, identities };
}