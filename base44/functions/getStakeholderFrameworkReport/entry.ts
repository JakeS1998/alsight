import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const INTERNAL = ['admin', 'director', 'regional_director', 'bsm', 'finance', 'bdm'];
const STAGES = ['pq_date', 'aa_signed', 'calloff_date', 'completed_on_time'];
const safeId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(value);
const safeRow = (r, internal) => ({
  id: r.id, project_id: r.project_id || null, project_number: r.project_number || null,
  framework_ref: r.framework_ref, site: r.site, client: r.client,
  pq_date: r.pq_date, pq_status: r.pq_status, aa_sent: r.aa_sent, aa_signed: r.aa_signed,
  calloff_date: r.calloff_date, completed_on_time: r.completed_on_time,
  completed_to_budget: r.completed_to_budget, zero_riddor: r.zero_riddor,
  apprenticeships: r.apprenticeships,
  ...(internal ? { indicative_value: r.indicative_value, aa_value: r.aa_value,
    calloff_value: r.calloff_value, completion_value: r.completion_value,
    access_fee: r.access_fee, local_spend: r.local_spend } : {}),
});

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const internal = INTERNAL.includes(user.role);
    if (!internal && user.role !== 'framework_stakeholder') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    const source = base44.asServiceRole.entities.FrameworkProjectReport;
    if (body?.reportId || body?.projectId) {
      if (body.reportId && !safeId(body.reportId) || body.projectId && !safeId(body.projectId))
        return Response.json({ error: 'Invalid project reference' }, { status: 400 });
      let report = body.reportId ? await source.get(body.reportId).catch(() => null) : null;
      if (!report && body.projectId) {
        const linked = await source.filter({ project_id: body.projectId }, '-created_date', 1);
        report = linked[0];
        if (!report) {
          const project = await base44.asServiceRole.entities.Project.get(body.projectId).catch(() => null);
          const number = /^PROJ(\d+)$/i.exec(project?.project_number || '');
          if (number) {
            const exact = await source.filter({ framework_ref: { $in: [number[1], `FW3${number[1]}`, project.project_number] } }, '-created_date', 1);
            report = exact[0];
          }
        }
      }
      return Response.json({ report: report ? safeRow(report, internal) : null });
    }
    const page = Number(body?.page ?? 0);
    if (!Number.isInteger(page) || page < 0 || page > 10000) return Response.json({ error: 'Invalid page' }, { status: 400 });
    const stage = STAGES.includes(body?.stage) ? body.stage : 'all';
    const search = String(body?.term || '').trim().slice(0, 80);
    const term = search.replace(/^PROJ(\d+)$/i, '$1').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const query = {
      ...(stage !== 'all' ? { [stage]: { $gt: '' } } : {}),
      ...(term ? { $or: ['framework_ref', 'project_number', 'site', 'client'].map(field => ({ [field]: { $regex: term, $options: 'i' } })) } : {}),
    };
    const [records, count, total, linked, questionnaire, agreement, calloff, outcomes,
      onTime, onTimeRecorded, toBudget, budgetRecorded, safe, safetyRecorded, commercial] = await Promise.all([
      source.filter(query, '-framework_ref', 50, page * 50), source.count(query), source.count({}),
      source.count({ project_id: { $gt: '' } }), source.count({ pq_date: { $gt: '' } }),
      source.count({ aa_signed: { $gt: '' } }), source.count({ calloff_date: { $gt: '' } }),
      source.count({ completed_on_time: { $gt: '' } }),
      source.count({ completed_on_time: 'Y' }), source.count({ completed_on_time: { $gt: '' } }),
      source.count({ completed_to_budget: 'Y' }), source.count({ completed_to_budget: { $gt: '' } }),
      source.count({ zero_riddor: 'Y' }), source.count({ zero_riddor: { $gt: '' } }),
      internal ? source.aggregate({ sum: ['calloff_value', 'completion_value'] }) : Promise.resolve(null),
    ]);
    const numbers = [...new Set(records.map(r => /^\d+$/.test(r.framework_ref || '') ? `PROJ${r.framework_ref}` : r.project_number).filter(Boolean))];
    const projects = numbers.length ? await base44.asServiceRole.entities.Project.filter({ project_number: { $in: numbers } }, '-created_date', 50) : [];
    const byNumber = new Map(projects.map(p => [p.project_number?.toUpperCase(), p.id]));
    const rows = records.map(r => ({ ...safeRow(r, internal),
      project_id: r.project_id || byNumber.get(`PROJ${r.framework_ref}`.toUpperCase()) || byNumber.get(r.project_number?.toUpperCase()) || null,
    }));
    return Response.json({ rows, count, total, linked, questionnaire, agreement, calloff, outcomes,
      onTime, onTimeRecorded, toBudget, budgetRecorded, safe, safetyRecorded,
      ...(internal ? { commercial: commercial?.rows?.[0] || null } : {}),
    });
  } catch (error) {
    console.error('Framework report unavailable', error);
    return Response.json({ error: 'Unable to load framework report' }, { status: 500 });
  }
}