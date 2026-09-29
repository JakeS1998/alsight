import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const STAGES = ['pq_date', 'aa_signed', 'calloff_date', 'completed_on_time'];
const clean = value => String(value || '').trim().slice(0, 80);

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'framework_stakeholder') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    const page = Number(body?.page || 0);
    if (!Number.isInteger(page) || page < 0 || page > 10000) return Response.json({ error: 'Invalid page' }, { status: 400 });
    const stage = STAGES.includes(body?.stage) ? body.stage : 'all';
    const term = clean(body?.term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const query = {
      ...(stage !== 'all' ? { [stage]: { $gt: '' } } : {}),
      ...(term ? { $or: ['framework_ref', 'site', 'client'].map(field => ({ [field]: { $regex: term, $options: 'i' } })) } : {}),
    };
    const source = base44.asServiceRole.entities.FrameworkProjectReport;
    const [records, count, total, questionnaire, agreement, calloff, outcomes] = await Promise.all([
      source.filter(query, '-framework_ref', 50, page * 50),
      source.count(query), source.count({}), source.count({ pq_date: { $gt: '' } }),
      source.count({ aa_signed: { $gt: '' } }), source.count({ calloff_date: { $gt: '' } }),
      source.count({ completed_on_time: { $gt: '' } }),
    ]);
    const rows = records.map(r => ({
      id: r.id, framework_ref: r.framework_ref, site: r.site, client: r.client,
      pq_date: r.pq_date, pq_status: r.pq_status, aa_signed: r.aa_signed,
      calloff_date: r.calloff_date, completed_on_time: r.completed_on_time,
      completed_to_budget: r.completed_to_budget, zero_riddor: r.zero_riddor,
      apprenticeships: r.apprenticeships,
    }));
    return Response.json({ rows, count, total, questionnaire, agreement, calloff, outcomes });
  } catch (error) {
    console.error('Framework stakeholder report unavailable', error);
    return Response.json({ error: 'Unable to load framework report' }, { status: 500 });
  }
}