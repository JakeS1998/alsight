export const completedWarrantyStatuses = ['sealed', 'executed', 'product_warranty'];
export async function loadProjectWarrantySchedule(base44, project) {
  const query = { project_id: { $in: [project.id, project.dataverse_id].filter(Boolean) }, status: { $ne: 'inactive' } };
  const executed = { date_of_execution: { $exists: true, $nin: [null, ''] } };
  const [warrantyCount, completedWarrantyCount, executedCount] = await Promise.all([
    base44.entities.Warranty.count(query),
    base44.entities.Warranty.count({ ...query, $or: [executed, { warranty_status: { $in: completedWarrantyStatuses } }] }),
    base44.entities.Warranty.count({ ...query, ...executed }),
  ]);
  if (warrantyCount > 300) throw new Error('This project has too many warranties for one handover pack (maximum 300).');
  const warranties = []; let cursor;
  do {
    const page = await base44.entities.Warranty.filter(query, { sort: 'warranty_id', limit: 100, fields: ['warranty_id', 'services', 'link_to_file', 'warranty_status', 'date_of_execution'], ...(cursor ? { cursor } : {}) });
    warranties.push(...page.items.map(warranty => ({ ...warranty, completed: !!warranty.date_of_execution || completedWarrantyStatuses.includes(warranty.warranty_status), completionLabel: warranty.date_of_execution ? 'Executed' : (warranty.warranty_status || 'outstanding').replaceAll('_', ' ') })));
    cursor = page.has_more ? page.next_cursor : null;
  } while (cursor);
  return { warranties, warrantyCount, completedWarrantyCount, executedCount };
}