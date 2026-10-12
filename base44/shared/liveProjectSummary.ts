import { projectValueAggregate } from './projectValueAggregate.ts';
export async function liveProjectSummary(entities, selection = {}) {
  const query = { ...selection, status: { $ne: 'inactive' }, dataverse_id: { $exists: true, $nin: [null, ''] } };
  const result = await projectValueAggregate(entities, { query, groupBy: 'live_project', sum: 'estimated_value' });
  if (result.truncated) throw new Error('Project totals are incomplete; partial figures are not displayed.');
  const live = result.rows.find(row => row.live_project === true);
  const held = result.rows.filter(row => row.live_project !== true);
  return {
    value: live?.sum_estimated_value || 0,
    projects: live?.count || 0,
    onHoldValue: held.reduce((total, row) => total + (row.sum_estimated_value || 0), 0),
    onHoldProjects: held.reduce((total, row) => total + row.count, 0),
    totalProjects: result.rows.reduce((total, row) => total + row.count, 0)
  };
}