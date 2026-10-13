import { projectValueAggregate } from './projectValueAggregate.ts';
export async function liveProjectSummary(entities, selection = {}) {
  const now = new Date().toISOString();
  const completed = await entities.ProjectDelivery.aggregate({query:{pc_achieved:{$gt:'',$lte:now}},groupBy:'project_id',limit:1000});
  if(completed.truncated)throw new Error('Completed project exclusions exceeded their reporting limit.');
  const completedIds = completed.rows.map(row=>row.project_id).filter(Boolean);
  const query = { $and: [selection, { status: { $ne: 'inactive' }, dataverse_id: { $exists: true, $nin: [null, ''] } }, { $or: [{live_project:true}, { $nor: [
    {approval_status:{$regex:'^\\s*(?:complete|completed)\\s*$',$options:'i'}},
    {practical_completion_date:{$gt:'',$lte:now}},
    ...(completedIds.length ? [{id:{$in:completedIds}},{dataverse_id:{$in:completedIds}}] : [])
  ] }] }] };
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