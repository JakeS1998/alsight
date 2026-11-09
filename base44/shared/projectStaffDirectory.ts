import { projectAssignedStaff } from './projectAssignedStaff.ts';
export default async function projectStaffDirectory(base44, requestedIds) {
  const fields = ['bdm_aad_id', 'bsm_aad_id', 'project_manager_id'];
  // Only resolve identities actually assigned to projects this caller can read.
  const pages = await Promise.all(fields.map(field => base44.entities.Project.filter(
    { [field]: { $in: requestedIds } }, { distinct: field, limit: 200 }
  )));
  const assigned = new Set(pages.flatMap(page => page.items));
  const authorised = requestedIds.filter(id => assigned.has(id));
  const names = {}, links = {};
  // Reuse the detail-page resolver in bounded groups, not one call per project.
  for (let start = 0; start < authorised.length; start += 10) {
    const result = await projectAssignedStaff(base44, authorised.slice(start, start + 10));
    Object.assign(names, result.names); Object.assign(links, result.links);
  }
  return { names, links };
}