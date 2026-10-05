import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin','director','regional_director','bsm','finance','bdm','client','supplier'].includes(user.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const input = await req.json();
    if (!Array.isArray(input.projectIds) || input.projectIds.length > 2000 || input.projectIds.some(id => typeof id !== 'string' || id.length > 100)) return Response.json({ error: 'Invalid portfolio selection' }, { status: 400 });
    const query = { id: { $in: input.projectIds.length ? input.projectIds : ['__empty_portfolio__'] } };
    const related = { project_id: { $in: input.projectIds.length ? input.projectIds : ['__empty_portfolio__'] } };
    const now = new Date().toISOString();
    const p5 = { $or: [{ riba5_system_date: { $gt: '', $lte: now } }, { riba4_end: { $gt: '', $lt: now } }] };
    const next = [p5, { riba3_end: { $gt: '', $lt: now } }, { riba2_end: { $gt: '', $lt: now } }, { riba1_end: { $gt: '', $lt: now } }];
    const stages = await Promise.all(next.concat([{}]).map((condition, index) => base44.entities.Project.aggregate({ query: { $and: [query, condition, ...next.slice(0, index).map(c => ({ $nor: [c] }))] }, sum: 'estimated_value' }).then(result => ({ stage: ['RIBA 5–7','RIBA 4','RIBA 3','RIBA 2','RIBA 1'][index], count: result.rows[0]?.count || 0, value: result.rows[0]?.sum_estimated_value || 0 }))));
    const opportunitiesQuery = { status: 'open', stage: { $nin: ['won','lost','on_hold'] } };
    const [projects, regions, opportunities, delivery, actions, decisions, risks, recent, milestones, coverage] = await Promise.all([
      base44.entities.Project.aggregate({ query, groupBy: 'live_project', sum: 'estimated_value' }),
      base44.entities.Project.aggregate({ query, groupBy: 'department_id', sum: 'estimated_value', sort: '-sum_estimated_value' }),
      base44.entities.Opportunity.aggregate({ query: opportunitiesQuery, groupBy: 'stage', sum: ['budget','alliance_fee'], avg: ['budget','probability'] }),
      base44.entities.ProjectDelivery.aggregate({ query: related, groupBy: 'client_handover', avg: 'pct_programme' }),
      base44.entities.ProjectAction.aggregate({ query: related, groupBy: 'status' }),
      base44.entities.ProjectDecision.aggregate({ query: related, groupBy: 'status' }),
      base44.entities.ProjectRisk.aggregate({ query: related, groupBy: 'status' }),
      base44.entities.Project.filter({ $and: [query, ...(typeof input.since === 'string' && !isNaN(Date.parse(input.since)) ? [{ updated_date: { $gt: input.since } }] : [])] }, { sort: '-updated_date', limit: 4 }),
      base44.entities.Project.filter({ $and: [query, { practical_completion_date: { $gte: now } }] }, { sort: 'practical_completion_date', limit: 4 }),
      Promise.all(['description','pq_approval_date','riba3_end','practical_completion_date'].map(field => base44.entities.Project.count({ $and: [query, { [field]: { $exists: true, $nin: ['',null] } }] })))
    ]);
    return Response.json({ stages: stages.reverse(), projects: projects.rows, regions: regions.rows, opportunities: opportunities.rows, delivery: delivery.rows, actions: actions.rows, decisions: decisions.rows, risks: risks.rows, recent: recent.items, milestones: milestones.items, coverage, refreshedAt: now });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}