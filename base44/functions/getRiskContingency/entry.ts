import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { weightedRiskPence } from '../../shared/riskWeightedCost.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(e => e.status === 401 ? null : Promise.reject(e));
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });
    const { projectId } = (await req.json().catch(() => null)) ?? {};
    if (typeof projectId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(projectId)) return Response.json({ error: 'Choose a project.' }, { status: 400 });
    const project = await base44.entities.Project.get(projectId).catch(e => e.status === 404 ? null : Promise.reject(e));
    if (!project) return Response.json({ error: 'Project not accessible.' }, { status: 404 });
    let cursor, weightedPence = 0, priced = 0, missing = 0;
    do {
      const page = await base44.entities.ProjectRisk.filter({ project_id: projectId, owner: 'Client', status: 'open' }, { sort: 'id', limit: 200, fields: ['anticipated_cost', 'probability_rating', 'impact_rating'], ...(cursor ? { cursor } : {}) });
      for (const risk of page.items) {
        const pence = weightedRiskPence(risk);
        if (pence === null) missing++;
        else { priced++; weightedPence += pence; }
      }
      if (priced + missing > 5000) return Response.json({ error: 'This register is too large to compare.' }, { status: 422 });
      cursor = page.has_more ? page.next_cursor : null;
    } while (cursor);
    return Response.json({ weightedPence, priced, missing });
  } catch (error) {
    console.error('Risk contingency comparison failed', error);
    return Response.json({ error: 'Unable to compare contingency with the risk register.' }, { status: 500 });
  }
}