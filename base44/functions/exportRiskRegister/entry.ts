import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { createRiskWorkbook } from '../../shared/riskWorkbook.ts';
import { createRiskPdf } from '../../shared/riskPdf.ts';
import { approvalSummary } from '../../shared/riskApprovalData.ts';
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req); const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });
    const { projectId, format, certified = false } = await req.json();
    if (typeof certified !== 'boolean') return Response.json({ error: 'Choose certified or non-certified.' }, { status: 400 });
    if (typeof projectId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(projectId) || !['pdf','xlsx'].includes(format)) return Response.json({ error: 'Choose PDF or Excel and a project.' }, { status: 400 });
    const project = await base44.entities.Project.get(projectId);
    if (!project) return Response.json({ error: 'Project not accessible.' }, { status: 403 });
    const [delivery, clients] = await Promise.all([base44.entities.ProjectDelivery.filter({ project_id: projectId }, { limit: 1, sort: '-updated_date' }), !project.client_name && project.client_account_id ? base44.entities.Account.filter({ $or: [{ id: project.client_account_id }, { dataverse_id: project.client_account_id }] }, { limit: 1, fields: ['name'] }) : { items: [] }]);
    let cursor; const rows = [];
    do { const page = await base44.entities.ProjectRisk.filter({ project_id: projectId }, { limit: 100, sort: 'reference', ...(cursor ? { cursor } : {}) }); rows.push(...page.items); cursor = page.has_more ? page.next_cursor : null; if (rows.length > 5000) return Response.json({ error: 'This register is too large to export in one file.' }, { status: 400 }); } while(cursor);
    rows.forEach(row => { row.risk_index = row.probability_rating && row.impact_rating ? row.probability_rating * row.impact_rating : null; });
    const context = { projectName: project.name, clientName: project.client_name || clients.items[0]?.name || 'Not recorded', contractor: delivery.items[0]?.contractor || 'Not recorded', date: new Date().toLocaleDateString('en-GB', { timeZone: 'Europe/London' }) };
    const approvals = format === 'pdf' && certified ? await approvalSummary(base44.asServiceRole.entities, projectId) : null;
    const bytes = format === 'xlsx' ? await createRiskWorkbook(context, rows) : createRiskPdf(context, rows, approvals);
    let binary = ''; for (let i=0;i<bytes.length;i+=8192) binary += String.fromCharCode(...bytes.subarray(i,i+8192));
    return Response.json({ content: btoa(binary), mime: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: `Risk-register-${String(project.project_number || project.name).replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,80)}${format === 'pdf' && certified ? '-certified' : ''}.${format}` });
  } catch (error) { console.error('Risk export failed',error); return Response.json({ error: 'Unable to export this risk register. Please try again.' }, { status: 500 }); }
}