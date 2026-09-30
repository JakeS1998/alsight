const regions = {
  'c180b661-4600-f111-8407-000d3a7ed0c8': 'South East & London', '9d15738c-4600-f111-8407-000d3a7ed0c8': 'West Midlands & North Wales',
  '0cde51a5-4600-f111-8407-000d3a7ed0c8': 'East', 'a69051ab-4600-f111-8407-000d3a7ed0c8': 'North',
  '336dddc3-4600-f111-8407-000d3a7ed0c8': 'Scotland & Northern Ireland', 'a7da8d48-4600-f111-8407-000d3a7ed0c8': 'South West & South Wales',
  '881a8516-e30b-f111-8407-7ced8d390a61': 'Insights & Engagement', '00947699-c808-f111-8407-000d3ad60c67': 'Marketing & Framework',
  'ff937699-c808-f111-8407-000d3ad60c67': 'Finance', '217d68a9-de01-f111-8407-6045bd11d101': 'Business Support Services', '2780e6dc-c808-f111-8406-6045bdd07c35': 'Executive',
};
const regionId = value => regions[value] ? value : Object.keys(regions).find(key => regions[key].toLowerCase() === String(value || '').trim().toLowerCase()) || '';
const directorRoles = ['director', 'regional_director'];

export async function bdmRequestDefaults(base44, bdmId) {
  const service = base44.asServiceRole.entities;
  const [people, contactPage] = await Promise.all([
    service.User.filter({ role: 'bdm', $or: [{ id: bdmId }, { staff_aad_id: bdmId }] }),
    service.Contact.filter({ portal_role: 'bdm', aad_id: bdmId }, { limit: 1 }),
  ]);
  const person = people[0];
  let contact = contactPage.items[0];
  if (!contact && person?.email) contact = (await service.Contact.filter({ portal_role: 'bdm', email: person.email }, { limit: 1 })).items[0];
  if (!person && !contact) throw new Error('BDM not found. Please select a listed BDM.');
  const staffIds = [...new Set([bdmId, person?.id, person?.staff_aad_id, contact?.aad_id].filter(Boolean))];
  const line = (await service.StaffReportingLine.filter({ staff_aad_id: { $in: staffIds }, source_matched: true }, { sort: '-created_date', limit: 1 })).items[0];
  const managerIds = [...new Set([person?.line_manager_id, line?.manager_aad_id].filter(Boolean))];
  let director = null;
  if (managerIds.length) {
    const [managers, managerContacts] = await Promise.all([
      service.User.filter({ role: { $in: directorRoles }, $or: [{ id: { $in: managerIds } }, { staff_aad_id: { $in: managerIds } }] }),
      service.Contact.filter({ portal_role: { $in: directorRoles }, aad_id: { $in: managerIds } }, { limit: 2 }),
    ]);
    const manager = managers.find(item => item.id === person?.line_manager_id) || managers[0];
    const managerContact = managerContacts.items[0];
    if (manager) director = { value: manager.id, label: manager.full_name || managerContact?.full_name || line?.manager_name || '', region: manager.region };
    else if (managerContact) director = { value: managerContact.aad_id, label: managerContact.full_name, region: managerContact.department };
  }
  let departmentId = regionId(person?.region) || regionId(contact?.department);
  if (!departmentId) {
    const portfolio = await service.Project.aggregate({ query: { bdm_aad_id: { $in: staffIds }, status: 'active', department_id: { $in: Object.keys(regions) } }, groupBy: 'department_id', limit: 12 });
    if (!portfolio.truncated && portfolio.rows.length === 1) departmentId = portfolio.rows[0].department_id;
  }
  departmentId ||= regionId(director?.region);
  const missing = [!director && 'Director', !departmentId && 'region'].filter(Boolean);
  return { director_aad_id: director?.value || '', department_id: departmentId, directorOption: director ? { value: director.value, label: director.label } : null, notice: missing.length ? `No unambiguous ${missing.join(' and ')} assignment is available for this BDM. Please select ${missing.length === 1 ? 'it' : 'them'} manually.` : '' };
}