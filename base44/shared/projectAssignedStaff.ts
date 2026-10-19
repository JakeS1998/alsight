import { flowConfig, sharedFlowContext, flowRequest } from './dataverseFlowApi.ts';
import { contactFullName, fullName, missingFullName } from './fullName.ts';
import { staffEmailQuery } from './staffReportingIdentity.ts';

const key = value => String(value || '').trim().toLowerCase();
const aliases = person => [person.id, person.staff_aad_id, person.dataverse_systemuser_id, person.data?.staff_aad_id, person.data?.dataverse_systemuser_id].filter(Boolean);
export async function projectAssignedStaff(base44, requestedIds, managerFor = '') {
  const ids = [...new Set(requestedIds.filter(Boolean))], db = base44.asServiceRole.entities;
  const names = {}, links = {};
  if (!ids.length) return { names, links };
  const [users, contactPage, directContacts, linePage] = await Promise.all([
    db.User.filter({ $or: [{ id: { $in: ids } }, { staff_aad_id: { $in: ids } }, { dataverse_systemuser_id: { $in: ids } }] }),
    db.Contact.filter({ $or: [{ aad_id: { $in: ids } }, { dataverse_id: { $in: ids } }] }, { limit: 30 }),
    ids.some(id => /^[0-9a-f]{24}$/i.test(id)) ? db.Contact.filter({ id: { $in: ids.filter(id => /^[0-9a-f]{24}$/i.test(id)) } }, { limit: 10 }) : Promise.resolve({ items: [] }),
    db.StaffReportingLine.filter({ source_matched: true, $or: [{ staff_aad_id: { $in: ids } }, { manager_aad_id: { $in: ids } }, { contact_id: { $in: ids } }] }, { limit: 50 }),
  ]);
  const contacts = [...new Map([...contactPage.items, ...directContacts.items].map(row => [row.id, row])).values()];
  const lines = linePage.items;
  for (const id of ids) {
    const person = users.find(row => aliases(row).some(value => key(value) === key(id)));
    const matches = contacts.filter(row => [row.id, row.aad_id, row.dataverse_id].some(value => key(value) === key(id)));
    const recorded = [...new Set(matches.map(contactFullName).filter(name => name !== missingFullName))];
    const reporting = [...new Set(lines.flatMap(row => key(row.staff_aad_id) === key(id) || row.contact_id === id ? [row.staff_name] : key(row.manager_aad_id) === key(id) ? [row.manager_name] : []).filter(Boolean))];
    const name = recorded.length === 1 ? recorded[0] : person && fullName(person.full_name) !== missingFullName ? fullName(person.full_name) : reporting.length === 1 ? reporting[0] : '';
    if (name) names[id] = name;
  }
  const managerLine = lines.find(row => key(row.staff_aad_id) === key(managerFor));
  const missing = ids.filter(id => !names[id]);
  const sourceIds = [...new Set([...missing, ...(managerFor && !managerLine?.manager_name ? [managerFor] : [])])].filter(id => /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id));
  let sourcePeople = [];
  if (sourceIds.length) {
    const config = await flowConfig(base44);
    if (config?.source_connection_id) {
      const context = await sharedFlowContext(base44, config);
      const filter = sourceIds.flatMap(id => [`systemuserid eq ${id}`, `azureactivedirectoryobjectid eq ${id}`]).join(' or ');
      const result = await flowRequest(context.environment, context.token, `systemusers?$select=systemuserid,azureactivedirectoryobjectid,fullname,internalemailaddress,_parentsystemuserid_value&$filter=${encodeURIComponent(filter)}&$top=12`, { headers: { Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"' } });
      sourcePeople = result.value || [];
      for (const id of missing) {
        const matches = sourcePeople.filter(row => [row.systemuserid, row.azureactivedirectoryobjectid].some(value => key(value) === key(id)));
        const values = [...new Set(matches.map(row => fullName(row.fullname)).filter(name => name !== missingFullName))];
        if (values.length === 1) names[id] = values[0];
      }
    }
  }
  const emails = [...new Set([...users.map(row => row.email), ...sourcePeople.map(row => row.internalemailaddress)].filter(Boolean))];
  const visible = await base44.entities.Contact.filter({ $or: [...(ids.some(id => /^[0-9a-f]{24}$/i.test(id)) ? [{ id: { $in: ids.filter(id => /^[0-9a-f]{24}$/i.test(id)) } }] : []), { aad_id: { $in: ids } }, { dataverse_id: { $in: ids } }, ...emails.map(email => ({ email: staffEmailQuery(email) }))] }, { limit: 40, fields: ['aad_id', 'dataverse_id', 'email'] });
  for (const id of ids) {
    const person = users.find(row => aliases(row).some(value => key(value) === key(id)));
    const source = sourcePeople.find(row => [row.systemuserid, row.azureactivedirectoryobjectid].some(value => key(value) === key(id)));
    const line = lines.find(row => key(row.staff_aad_id) === key(id));
    const email = person?.email || source?.internalemailaddress || line?.staff_email;
    const matches = visible.items.filter(row => [row.id, row.aad_id, row.dataverse_id].some(value => key(value) === key(id)) || row.id === line?.contact_id || (email && key(row.email) === key(email)));
    if (matches.length === 1) links[id] = `/people/${matches[0].id}`;
  }
  const source = sourcePeople.find(row => [row.systemuserid, row.azureactivedirectoryobjectid].some(value => key(value) === key(managerFor)));
  return { names, links, managerName: managerLine?.manager_name || source?.['_parentsystemuserid_value@OData.Community.Display.V1.FormattedValue'] || '', managerId: managerLine?.manager_aad_id || source?._parentsystemuserid_value || '' };
}