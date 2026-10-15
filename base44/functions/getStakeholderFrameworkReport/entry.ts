import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { completionOutcome, reportProject } from '../../shared/uklfCompletion.ts';
import { uklfPortfolioSummary } from '../../shared/uklfPortfolioSummary.ts';
import { uklfReportScope } from '../../shared/uklfReportScope.ts';
import {frameworkWorkspace} from '../../shared/frameworkWorkspace.ts';
import {dataRequestError} from '../../shared/dataRequestError.ts';
import {kpiReadFields,frameworkKpiCompletion} from '../../shared/frameworkKpiRules.ts';
import {frameworkKpiSummary} from '../../shared/frameworkKpiSummary.ts';
import {projectCompletionDates} from '../../shared/projectCompletionDates.ts';

const INTERNAL = ['admin', 'director', 'regional_director', 'bsm', 'finance', 'bdm'];
const STAGES = ['pq_date', 'aa_signed', 'calloff_date', 'completed_on_time'];
const safeId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(value);
const normalize = value => ` ${String(value || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ')} `;
const legacyName = project => normalize((project.name || '').replace(/\s*\([^)]*\)\s*$/, '').replace(/\s+(refurbishment|refurb)\s*$/i, '')).trim();
async function suggestedKpis(base44, project) {
  if (!project) return {};
  const page=await base44.entities.ProjectDelivery.filter({project_id:project.id},{limit:1,fields:['contract_sum','original_pc','lad_completion_date','pc_achieved']});
  const delivery=page.items[0] || {};
  return {contractual_completion_date:delivery.lad_completion_date || delivery.original_pc || projectCompletionDates(project).riba5_system_date || '',actual_completion_date:delivery.pc_achieved || project.practical_completion_date || '',contract_sum:delivery.contract_sum ?? null,pq_date:project.pq_approval_date || '',aa_signed:project.aa_executed_date || ''};
}
const safeRow = (r, internal) => ({
  id: r.id, project_id: r.project_id || null, project_number: r.project_number || null,
  framework_ref: r.framework_ref, site: r.site, client: r.client,
  pq_date: r.pq_date, pq_status: r.pq_status, aa_sent: r.aa_sent, aa_signed: r.aa_signed,
  calloff_date: r.calloff_date, completed_on_time: r.completed_on_time,
  completed_to_budget: r.completed_to_budget, zero_riddor: r.zero_riddor,
  riddor_incidents: r.riddor_incidents ?? null,
  apprenticeships: r.apprenticeships, created_date:r.created_date, updated_date:r.updated_date,
  ...Object.fromEntries(kpiReadFields.map(key=>[key,r[key] ?? null])),
  ...(internal ? {indicative_value:r.indicative_value,aa_value:r.aa_value,calloff_value:r.calloff_value,completion_value:r.completion_value,access_fee:r.access_fee,local_spend:r.local_spend} : {}),

});

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const internal = INTERNAL.includes(user.role);
    if (!internal && user.role !== 'framework_stakeholder') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    if(body.workspaceAction==='kpiSummary') {
      const year=Number(body.year || new Date().getFullYear());
      if(!Number.isInteger(year) || year<2026 || year>new Date().getFullYear())return Response.json({error:'Invalid reporting year'},{status:400});
      const scope=await uklfReportScope(base44.asServiceRole.entities);
      const result=await frameworkKpiSummary(internal ? base44.entities.FrameworkProjectReport : base44.asServiceRole.entities.FrameworkProjectReport,scope,year);
      return Response.json(result);
    }
    if(body.workspaceAction) {
      if(!['summary','clients','list','map','detail','link'].includes(body.workspaceAction))return Response.json({error:'Invalid Framework operation.'},{status:400});
      const response=await frameworkWorkspace(base44,user,body);
      // Call-off totals and FW breakdown share Alliance360's financial-year calculation.
      response.headers.set('Cache-Control','no-store');
      return response;
    }
    const source = base44.asServiceRole.entities.FrameworkProjectReport;
    if (body?.reportId || body?.projectId) {
      if (body.reportId && !safeId(body.reportId) || body.projectId && !safeId(body.projectId))
        return Response.json({ error: 'Invalid project reference' }, { status: 400 });
      if (body.projectId) {
        const requestedProject = await base44.entities.Project.get(body.projectId).catch(() => null);
        if (!requestedProject)return Response.json({error:'Project unavailable'},{status:404});
        if (requestedProject?.procurement_route === false) return Response.json({ report: null, directProject: true });
      }
      let report = body.reportId ? await source.get(body.reportId).catch(() => null) : null;
      if (!report && body.projectId) {
        const linked = await source.filter({ project_id: body.projectId }, '-created_date', 1);
        report = linked[0];
        if (!report) {
          const project = await base44.entities.Project.get(body.projectId).catch(() => null);
          const number = /^PROJ(\d+)$/i.exec(project?.project_number || '');
          if (number) {
            const exact = await source.filter({ framework_ref: { $in: [number[1], `FW3${number[1]}`, project.project_number] } }, '-created_date', 1);
            report = exact[0];
          }
        }
      }
      const project = report ? await reportProject({asServiceRole:{entities:base44.entities}}, report, body.projectId) : null;
      if (project?.procurement_route === false) return Response.json({ report: null, directProject: true });
      const defaults = internal && report ? await suggestedKpis(base44, project) : {};
      return Response.json({report:report ? safeRow(report,internal) : null,kpiCompletion:frameworkKpiCompletion(report),...(internal && report ? {defaults} : {})});
    }
    const page = Number(body?.page ?? 0);
    if (!Number.isInteger(page) || page < 0 || page > 10000) return Response.json({ error: 'Invalid page' }, { status: 400 });
    const stage = STAGES.includes(body?.stage) ? body.stage : 'all';
    const search = String(body?.term || '').trim().slice(0, 80);
    const term = search.replace(/^PROJ(\d+)$/i, '$1').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const scope = await uklfReportScope(base44.asServiceRole.entities);
    const query = { $and: [scope, {
      ...(stage !== 'all' ? { [stage]: { $gt: '' } } : {}),
      ...(term ? { $or: ['framework_ref', 'project_number', 'site', 'client'].map(field => ({ [field]: { $regex: term, $options: 'i' } })) } : {}),
    }] };
    const [records, count, summary] = await Promise.all([
      source.filter(query, '-framework_ref', 50, page * 50), source.count(query), uklfPortfolioSummary(source, internal, scope),
    ]);
    const numbers = [...new Set(records.map(r => /^\d+$/.test(r.framework_ref || '') ? `PROJ${r.framework_ref}` : r.project_number).filter(Boolean))];
    const projects = numbers.length ? await base44.asServiceRole.entities.Project.filter({ project_number: { $in: numbers } }, '-created_date', 50) : [];
    const byNumber = new Map(projects.map(p => [p.project_number?.toUpperCase(), p.id]));
    const rows = records.map(r => ({ ...safeRow(r, internal),
      project_id: r.project_id || byNumber.get(`PROJ${r.framework_ref}`.toUpperCase()) || byNumber.get(r.project_number?.toUpperCase()) || null,
    }));
    return Response.json({ rows, count, ...summary });
  } catch (error) {
    console.error('Framework report unavailable', error);
    return dataRequestError(error, 'Unable to load framework report');
  }
}