import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const INTERNAL = ['admin', 'director', 'regional_director', 'bsm', 'finance', 'bdm'];
const OUTCOMES = ['Y', 'N', ''];
const FIELDS = ['completed_on_time', 'completed_to_budget', 'zero_riddor'];

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 });
    if (!INTERNAL.includes(user.role)) return Response.json({ error: 'Internal team access required' }, { status: 403 });
    const { reportId, kpis } = await req.json();
    if (typeof reportId !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(reportId) || !kpis || typeof kpis !== 'object' || Array.isArray(kpis))
      return Response.json({ error: 'Invalid KPI submission' }, { status: 400 });
    if (FIELDS.some(field => !OUTCOMES.includes(kpis[field])))
      return Response.json({ error: 'Choose Yes, No or Not recorded for each outcome' }, { status: 400 });
    if (kpis.local_spend !== null && (typeof kpis.local_spend !== 'number' || !Number.isFinite(kpis.local_spend) || kpis.local_spend < 0 || kpis.local_spend > 1e12))
      return Response.json({ error: 'Local spend must be a valid non-negative amount' }, { status: 400 });
    if (kpis.apprenticeships !== null && (!Number.isInteger(kpis.apprenticeships) || kpis.apprenticeships < 0 || kpis.apprenticeships > 100000))
      return Response.json({ error: 'Apprenticeships must be a valid non-negative whole number' }, { status: 400 });
    const source = base44.asServiceRole.entities.FrameworkProjectReport;
    const existing = await source.get(reportId).catch(() => null);
    if (!existing) return Response.json({ error: 'UKLF report not found' }, { status: 404 });
    const changes = {
      completed_on_time: kpis.completed_on_time,
      completed_to_budget: kpis.completed_to_budget,
      zero_riddor: kpis.zero_riddor,
      local_spend: kpis.local_spend,
      apprenticeships: kpis.apprenticeships,
    };
    await source.update(reportId, changes);
    return Response.json({ kpis: changes });
  } catch (error) {
    console.error('Unable to update UKLF KPIs', error);
    return Response.json({ error: 'Unable to save UKLF KPIs' }, { status: 500 });
  }
}