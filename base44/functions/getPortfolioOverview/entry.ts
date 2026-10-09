import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { portfolioCachedRead, projectOverviewRollups } from '../../shared/portfolioOverviewReads.ts';
import { readPortfolioStages } from '../../shared/portfolioStageSummary.ts';
import { portfolioFinancialFigures, portfolioStatusRollups } from '../../shared/portfolioKeyFigures.ts';
import { portfolioBusinessContext } from '../../shared/portfolioBusinessContext.ts';
import {projectValueAggregate} from '../../shared/projectValueAggregate.ts';
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin','director','regional_director','bsm','finance','bdm','client','supplier'].includes(user.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const input = await req.json();
    if (!Array.isArray(input.projectIds) || input.projectIds.length > 2000 || input.projectIds.some(id => typeof id !== 'string' || id.length > 100)) return Response.json({ error: 'Invalid portfolio selection' }, { status: 400 });
    const query = { id: { $in: input.projectIds.length ? input.projectIds : ['000000000000000000000000'] } };
    const related = { project_id: { $in: input.projectIds.length ? input.projectIds : ['000000000000000000000000'] } };
    const cachedRead = portfolioCachedRead(user, input);
    const now = new Date().toISOString();
    const stages = await readPortfolioStages(base44.entities, query, now, cachedRead);
    const opportunitiesQuery = { status: 'open', stage: { $nin: ['won','lost','on_hold'] } };
    const [projectRollups, opportunities, delivery, actions, decisions, risks, recent, milestones, coverage] = await (async () => {
      const results = [];
      const reads = [
      async () => projectOverviewRollups(await projectValueAggregate(base44.entities,{ query, groupBy: ['live_project', 'department_id'], sum: 'estimated_value', limit: 1000 })),
      () => base44.entities.Opportunity.aggregate({ query: opportunitiesQuery, groupBy: 'stage', sum: ['budget','alliance_fee'], avg: ['budget','probability'] }),
      () => base44.entities.ProjectDelivery.aggregate({ query: related, groupBy: 'client_handover', avg: 'pct_programme' }),
      () => base44.entities.ProjectAction.aggregate({ query: related, groupBy: ['project_id','status','due_date','priority'], limit: 1000 }),
      () => base44.entities.ProjectDecision.aggregate({ query: related, groupBy: 'status' }),
      () => base44.entities.ProjectRisk.aggregate({ query: related, groupBy: 'status' }),
      () => base44.entities.Project.filter({ ...query, ...(typeof input.since === 'string' && !isNaN(Date.parse(input.since)) ? { updated_date: { $gt: input.since } } : {}) }, { sort: '-updated_date', limit: 4, fields: ['name','updated_date'] }),
      () => base44.entities.Project.filter({ ...query, practical_completion_date: { $gte: now } }, { sort: 'practical_completion_date', limit: 4, fields: ['name','practical_completion_date'] }),
      async () => {
        const counts = [];
        for (const field of ['description','pq_approval_date','riba3_end','practical_completion_date']) counts.push(await base44.entities.Project.count({ $and: [query, { [field]: { $exists: true, $nin: ['',null] } }] }));
        return counts;
      }
      ];
      for (let index = 0; index < reads.length; index += 2) {
        const batch = reads.slice(index, index + 2);
        results.push(...await Promise.all(batch.map((read, offset) => cachedRead(`summary:${index + offset}`, read))));
      }
      return results;
    })();
    if(actions.truncated) throw new Error('Portfolio flag figures exceeded their reporting limit.');
    const keyFigures=await cachedRead('key-figures:v1',()=>portfolioFinancialFigures(base44.entities,related,actions.rows,now));
    const businessContext=await portfolioBusinessContext(base44,user,now);
    return Response.json({ stages, projects: projectRollups.projects, regions: projectRollups.regions, opportunities: opportunities.rows, delivery: delivery.rows, actions: portfolioStatusRollups(actions.rows), decisions: decisions.rows, risks: risks.rows, recent: recent.items, milestones: milestones.items, coverage, keyFigures, businessContext, refreshedAt: now });
  } catch (error) { return Response.json({ error: error.message }, { status: /rate limit|too many requests/i.test(error.message) ? 429 : 500 }); }
}