import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const reply = (error, status = 403) => Response.json({ error }, { status });
const legacy = project => { const m = /^PROJ\s*0*(\d+)$/i.exec(project.project_number || ''); return !!m && Number(m[1]) < 600; };
const normalize = value => ` ${String(value || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ')} `;
const legacyName = project => normalize((project.name || '').replace(/\s*\([^)]*\)\s*$/, '').replace(/\s+(refurbishment|refurb)\s*$/i, '')).trim();
const matchesPO = (po, project) => {
  if (legacy(project)) {
    if (po.legal_project_id) return po.legal_project_id === project.id;
    const name = legacyName(project);
    return name.length >= 8 && normalize((po.notes || '').split(/\bDetail\s*:/i).pop()).includes(` ${name} `);
  }
  return !!project.project_number && /^PROJ\s*\d+$/i.test(project.project_number) && po.project_ref === project.project_number;
};
async function all(entity, query) {
  const rows = [];
  for (let skip = 0; ; skip += 500) {
    const batch = await entity.filter(query, '-created_date', 500, skip);
    rows.push(...batch);
    if (batch.length < 500) return rows;
  }
}
const summary = p => ({ id: p.id, name: p.name, updated_date: p.updated_date, project_number: p.project_number, dataverse_id: p.dataverse_id, client_name: p.client_name, client_account_id: p.client_account_id, live_project: p.live_project, status: p.status, department_id: p.department_id, latitude: p.latitude, longitude: p.longitude, riba1_end: p.riba1_end, riba2_end: p.riba2_end, riba3_end: p.riba3_end, riba4_end: p.riba4_end, riba1_system_date: p.riba1_system_date, riba2_system_date: p.riba2_system_date, riba3_system_date: p.riba3_system_date, riba4_system_date: p.riba4_system_date, riba5_system_date: p.riba5_system_date, practical_completion_date: p.practical_completion_date, site_postcode: p.site_postcode, procurement_route: p.procurement_route, approval_status: p.approval_status, aa_executed_date: p.aa_executed_date, pq_approval_date: p.pq_approval_date, riba1_term_weeks: p.riba1_term_weeks, riba2_term_weeks: p.riba2_term_weeks, riba3_term_weeks: p.riba3_term_weeks, riba4_term_weeks: p.riba4_term_weeks, construction_term_weeks: p.construction_term_weeks, bdm_aad_id: p.bdm_aad_id, bsm_aad_id: p.bsm_aad_id, project_manager_id: p.project_manager_id, client_rep_id: p.client_rep_id, created_date: p.created_date });

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return reply('Sign in required', 401);
    if (user.role !== 'supplier') return reply('Supplier access required');
    const accountId = user.account_id || user.data?.account_id;
    if (!accountId) return reply('Supplier account required');
    const { action, projectId } = await req.json();
    if (!['projects', 'project', 'orders'].includes(action)) return reply('Unknown action', 400);
    const db = base44.asServiceRole.entities;
    const account = await db.Account.filter({ dataverse_id: accountId, account_type: 'supplier' }, '-created_date', 1);
    if (!account.length) return reply('Supplier account not found');
    const companyNumber = account[0].company_number;
    const poDb = db.PurchaseOrder;
    const supplierPOs = companyNumber ? await all(poDb, { supplier_company_number: companyNumber }) : [];

    if (action === 'projects') {
      const [documents, warranties, jcts] = await Promise.all([
        all(db.LegalDocument, { account_id: accountId }),
        all(db.Warranty, { $or: [{ account_id: accountId }, { supplier_id: accountId }] }),
        all(db.JCT, { $or: [{ account_id: accountId }, { contractor_id: accountId }] }),
      ]);
      const dvIds = [...new Set([...documents, ...warranties, ...jcts].map(r => r.project_id).filter(Boolean))];
      const legalIds = [...new Set(supplierPOs.map(po => po.legal_project_id).filter(Boolean))];
      const refs = [...new Set(supplierPOs.map(po => po.project_ref).filter(ref => /^PROJ\s*\d+$/i.test(ref || '')))];
      const query = [];
      if (dvIds.length) query.push({ dataverse_id: { $in: dvIds } });
      if (legalIds.length) query.push({ id: { $in: legalIds } });
      if (refs.length) query.push({ project_number: { $in: refs } });
      if (supplierPOs.some(po => !po.legal_project_id)) query.push({ project_number: { $regex: '^PROJ\\s*0*[0-5]?[0-9]{1,2}$', $options: 'i' } });
      if (!query.length) return Response.json({ projects: [] });
      const candidates = await all(db.Project, { status: { $ne: 'inactive' }, $or: query });
      const projects = candidates.filter(p => dvIds.includes(p.dataverse_id) || supplierPOs.some(po => matchesPO(po, p)));
      return Response.json({ projects: projects.map(summary) });
    }

    if (typeof projectId !== 'string' || !projectId) return reply('Project required', 400);
    const project = await db.Project.get(projectId).catch(() => null);
    if (!project || project.status === 'inactive') return reply('Project not available');
    const [docs, warranties, jcts] = await Promise.all([
      db.LegalDocument.filter({ project_id: project.dataverse_id, account_id: accountId }, '-created_date', 1),
      db.Warranty.filter({ project_id: project.dataverse_id, $or: [{ account_id: accountId }, { supplier_id: accountId }] }, '-created_date', 1),
      db.JCT.filter({ project_id: project.dataverse_id, $or: [{ account_id: accountId }, { contractor_id: accountId }] }, '-created_date', 1),
    ]);
    const orders = supplierPOs.filter(po => matchesPO(po, project));
    if (!docs.length && !warranties.length && !jcts.length && !orders.length) return reply('Project not available');
    if (action === 'project') return Response.json({ project: summary(project) });
    return Response.json({ orders: orders.map(po => ({ id: po.id, po_number: po.po_number, project_ref: po.project_ref, approval_status: po.approval_status, approval_date: po.approval_date, sent_date: po.sent_date, total_net_value: po.total_net_value })) });
  } catch (error) {
    console.error('Supplier project access failed', error);
    return reply(error.message || 'Unable to load supplier projects', 500);
  }
}