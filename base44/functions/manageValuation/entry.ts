import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

const response = (message, status = 400) => Response.json({ error: message }, { status });
const money = (n) => Math.round((Number(n) || 0) * 100) / 100;
const date = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
const str = (s, max = 2000) => typeof s === 'string' ? s.trim().slice(0, max) : '';
const internal = ['admin', 'director', 'regional_director', 'bsm', 'bdm', 'finance'];
const reviewers = ['admin', 'director', 'bsm', 'bdm'];
const paymentStates = ['awaiting_invoice', 'invoice_received', 'approved_for_payment', 'scheduled', 'paid', 'on_hold'];
const managerServices = 'project manager|project management|(^|[^a-z])pm([^a-z]|$)';
const supplierAccount = user => user.account_id || user.data?.account_id;
const supplierWarrantyQuery = accountId => ({ $or: [{ account_id: accountId }, { supplier_id: accountId }] });

async function supplierCanManage(base44, accountId, projectDvId) {
  if (!accountId || !projectDvId) return false;
  const [appointments, warranties] = await Promise.all([
    base44.asServiceRole.entities.LegalDocument.filter({ project_id: projectDvId, account_id: accountId, document_type: 'appointment_pm', status: 'active' }, '-created_date', 1),
    base44.asServiceRole.entities.Warranty.filter({ project_id: projectDvId, status: 'active', services: { $regex: managerServices, $options: 'i' }, ...supplierWarrantyQuery(accountId) }, '-created_date', 1),
  ]);
  return appointments.length > 0 || warranties.length > 0;
}

async function allMatches(entity, query) {
  const rows = [];
  for (let skip = 0; ; skip += 500) {
    const batch = await entity.filter(query, '-created_date', 500, skip);
    rows.push(...batch);
    if (batch.length < 500) return rows;
  }
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return response('Sign in required', 401);
    const input = await req.json();
    const { action, projectId, valuationId } = input;
    const contactId = user.contact_dataverse_id || user.data?.contact_dataverse_id;
    const external = user.role === 'project_manager' && !!contactId;
    const publicProject = p => ({ id: p.id, name: p.name, project_number: p.project_number, dataverse_id: p.dataverse_id, project_manager_id: p.project_manager_id, client_name: p.client_name, site_postcode: p.site_postcode, bdm_aad_id: p.bdm_aad_id, bsm_aad_id: p.bsm_aad_id, live_project: p.live_project, department_id: p.department_id, practical_completion_date: p.practical_completion_date, riba1_end: p.riba1_end, riba2_end: p.riba2_end, riba3_end: p.riba3_end, riba4_end: p.riba4_end, riba1_system_date: p.riba1_system_date, riba2_system_date: p.riba2_system_date, riba3_system_date: p.riba3_system_date, riba4_system_date: p.riba4_system_date, riba5_system_date: p.riba5_system_date, riba1_term_weeks: p.riba1_term_weeks, riba2_term_weeks: p.riba2_term_weeks, riba3_term_weeks: p.riba3_term_weeks, riba4_term_weeks: p.riba4_term_weeks, construction_term_weeks: p.construction_term_weeks, procurement_route: p.procurement_route, approval_status: p.approval_status, aa_executed_date: p.aa_executed_date, pq_approval_date: p.pq_approval_date, client_rep_id: p.client_rep_id, ...(user.role !== 'supplier' ? { link_to_riba4_report: p.link_to_riba4_report } : {}) });
    if (action === 'projects') {
      if (external) {
        const projects = await base44.asServiceRole.entities.Project.filter({ project_manager_id: contactId }, '-created_date', 500);
        return Response.json({ projects: projects.map(publicProject) });
      }
      if (user.role !== 'supplier' || !supplierAccount(user)) return response('Project manager access required', 403);
      const accountId = supplierAccount(user);
      const [appointments, warranties] = await Promise.all([
        allMatches(base44.asServiceRole.entities.LegalDocument, { account_id: accountId, document_type: 'appointment_pm', status: 'active' }),
        allMatches(base44.asServiceRole.entities.Warranty, { status: 'active', services: { $regex: managerServices, $options: 'i' }, ...supplierWarrantyQuery(accountId) }),
      ]);
      const ids = [...new Set([...appointments, ...warranties].map(row => row.project_id).filter(Boolean))];
      const projects = ids.length ? await allMatches(base44.asServiceRole.entities.Project, { dataverse_id: { $in: ids }, status: { $ne: 'inactive' } }) : [];
      return Response.json({ projects: projects.map(project => ({ ...publicProject(project), can_submit_valuation: true })) });
    }
    if (!projectId || typeof projectId !== 'string') return response('Project required');
    const project = external || user.role === 'supplier' ? await base44.asServiceRole.entities.Project.get(projectId).catch(() => null) : await base44.entities.Project.get(projectId).catch(() => null);
    const isManager = external && project?.project_manager_id === contactId;
    const isSupplierManager = user.role === 'supplier' && project?.status !== 'inactive' && await supplierCanManage(base44, supplierAccount(user), project?.dataverse_id);
    if (!project || (external && !isManager)) return response('Project not available', 403);
    if (!isManager && !isSupplierManager && !internal.includes(user.role)) return response('Not authorised for valuations', 403);
    if (action === 'project') return Response.json({ project: { ...publicProject(project), can_submit_valuation: isManager || isSupplierManager } });
    if (action === 'riba_dates') {
      if (!isManager && !isSupplierManager) return response('Project manager access required', 403);
      const keys = ['riba1_end', 'riba2_end', 'riba3_end', 'riba4_end', 'practical_completion_date'];
      const changes = {};
      for (const key of keys) {
        if (key === 'practical_completion_date' && input[key] === undefined) continue;
        const value = input[key];
        if (value !== null && (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) return response('Enter valid RIBA end dates');
        changes[key] = value ? `${value}T00:00:00.000Z` : null;
      }
      const updated = await base44.asServiceRole.entities.Project.update(projectId, changes);
      return Response.json({ project: publicProject(updated) });
    }
    if (action === 'document_status') {
      if (!isManager && !isSupplierManager) return response('Project manager access required', 403);
      if (!project.dataverse_id) return Response.json({ statuses: {}, timeline: [], warranties: [] });
      const db = base44.asServiceRole.entities;
      const [docs, dmas, jcts, warranties] = await Promise.all([
        db.LegalDocument.filter({ project_id: project.dataverse_id }, '-created_date', 200),
        db.DMA.filter({ project_id: project.dataverse_id }, '-created_date', 100),
        db.JCT.filter({ project_id: project.dataverse_id }, '-created_date', 100),
        db.Warranty.filter({ project_id: project.dataverse_id }, '-created_date', 200),
      ]);
      const status = doc => {
        if (!doc) return 'Not recorded';
        if (doc.executed === 'yes' || doc.date_of_execution) return 'Executed';
        if (doc.executed === 'po') return 'PO issued';
        if (doc.sent_for_signing || doc.sent_to_client) return 'Sent for signing';
        if (doc.approval_date || /^approved/i.test(doc.approval_status || '')) return 'Approved';
        if (doc.drafted_date) return 'Drafted';
        return 'In progress';
      };
      const aa = docs.find(d => d.document_type === 'access_agreement');
      const statuses = {
        pcsa: status(docs.find(d => d.document_type === 'pcsa')),
        aa: aa ? status(aa) : project.aa_executed_date ? 'Executed' : 'Not recorded',
        dma: status(dmas[0]), jct: status(jcts[0]),
      };
      const accountId = supplierAccount(user);
      const own = record => !!accountId && [record.account_id, record.supplier_id, record.contractor_id].includes(accountId);
      const timeline = [];
      const add = (date, label, cat) => {
        if (date && !Number.isNaN(Date.parse(date))) timeline.push({ date, label, cat });
      };
      add(project.pq_approval_date, 'Project Questionnaire approved', 'project');
      add(project.aa_executed_date, 'Access Agreement executed', 'project');
      add(project.practical_completion_date, 'Practical completion', 'project');
      for (const n of [1, 2, 3, 4]) add(project[`riba${n}_end`], `RIBA Stage ${n} complete`, 'project');
      for (const doc of docs) {
        if (isSupplierManager && own(doc)) continue;
        const label = ({ pcsa: 'PCSA', access_agreement: 'Access Agreement', appointment_pm: 'PM appointment', appointment_architect: 'Architect appointment', appointment_pd_cdm: 'PD CDM appointment', appointment_pd_br: 'PD BR appointment', loi: 'LOI', additional_works: 'Additional works' })[doc.document_type] || 'Legal document';
        add(doc.drafted_date, `${label} drafted`, 'legal');
        add(doc.approval_date, `${label} approved`, 'legal');
        add(doc.sent_to_client, `${label} sent to client`, 'legal');
        add(doc.date_of_execution, `${label} executed`, 'legal');
      }
      for (const doc of dmas) {
        add(doc.drafted_date, 'DMA drafted', 'dma');
        add(doc.approval_date, 'DMA approved', 'dma');
        add(doc.sent_for_signing, 'DMA sent for signing', 'dma');
        add(doc.date_of_execution, 'DMA executed', 'dma');
      }
      for (const doc of jcts) {
        if (isSupplierManager && own(doc)) continue;
        add(doc.drafted_date, 'JCT drafted', 'jct');
        add(doc.sent_for_signing, 'JCT sent for signing', 'jct');
        add(doc.date_of_execution, 'JCT executed', 'jct');
        add(doc.practical_completion, 'JCT practical completion', 'jct');
      }
      for (const doc of warranties) {
        if (isSupplierManager && own(doc)) continue;
        const label = `Warranty ${doc.warranty_id || ''}`.trim();
        add(doc.drafted_date, `${label} drafted`, 'warranty');
        add(doc.date_of_execution, `${label} executed`, 'warranty');
        add(doc.warranty_due, `${label} due`, 'warranty');
      }
      const warrantyStatuses = {
        awaiting_jct: 'Awaiting JCT', awaiting_appointment: 'Awaiting appointment',
        in_review: 'In review', sent_for_seal: 'Sent for seal', drafted: 'Drafted',
      };
      return Response.json({ statuses,
        timeline: timeline.sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 150),
        warranties: warranties.filter(w => !isSupplierManager || !own(w)).map(w => ({
          id: w.id, reference: w.warranty_id || '', service: w.services || '',
          status: w.date_of_execution ? 'Executed' : warrantyStatuses[w.warranty_status] || 'Not recorded',
        })),
      });
    }
    if (action === 'list') {
      if (!isManager && !isSupplierManager) return response('Project manager access required', 403);
      const valuations = await base44.asServiceRole.entities.Valuation.filter({ project_id: projectId }, '-number', 500);
      return Response.json({ valuations: valuations.filter(v => v.status !== 'draft' || v.draft_owner_id === user.id || (!v.draft_owner_id && v.audit?.find(e => e.kind === 'Created')?.actor_id === user.id)) });
    }
    const actor = user.full_name || user.email;
    const now = new Date().toISOString();
    const db = base44.asServiceRole.entities.Valuation;
    if (action === 'meta') {
      const delivery = await base44.asServiceRole.entities.ProjectDelivery.filter({ project_id: projectId }, '-created_date', 1);
      const manager = project.project_manager_id ? await base44.asServiceRole.entities.Contact.filter({ dataverse_id: project.project_manager_id }, '-created_date', 1) : [];
      const contractor = project.contractor_contact_id ? await base44.asServiceRole.entities.Contact.filter({ dataverse_id: project.contractor_contact_id }, '-created_date', 1) : [];
      return Response.json({ meta: { contract_sum: delivery[0]?.contract_sum ?? null, contract_start: delivery[0]?.contract_start || null, manager_name: manager[0]?.full_name || '', contractor_name: contractor[0]?.full_name || '' } });
    }
    const event = (kind, previous = '', next = '') => ({ kind, actor, actor_id: user.id, organisation: isManager || isSupplierManager ? 'External Project Manager' : 'Alliance Leisure', at: now, previous, next });
    if (action === 'create') {
      if (!isManager && !isSupplierManager && user.role !== 'admin') return response('Only the assigned project manager can create a valuation', 403);
      const existing = await db.filter({ project_id: projectId }, '-number', 500);
      const number = Math.max(0, ...existing.map(v => Number(v.number) || 0)) + 1;
      const record = await db.create({ project_id: projectId, project_manager_contact_id: project.project_manager_id || '', bdm_aad_id: project.bdm_aad_id || '', bsm_aad_id: project.bsm_aad_id || '', department_id: project.department_id || '', number, status: 'draft', draft_owner_id: user.id, items: [], deductions: [], attachments: [], comments: [], audit: [event('Created', '', `Valuation ${number}`)], retention_percent: 0, payment_status: 'awaiting_invoice' });
      return Response.json({ valuation: record });
    }
    if (!valuationId || typeof valuationId !== 'string') return response('Valuation required');
    const record = await db.get(valuationId).catch(() => null);
    if (!record || record.project_id !== projectId) return response('Valuation not available', 404);
    if (record.status === 'draft' && (record.draft_owner_id || record.audit?.find(e => e.kind === 'Created')?.actor_id) !== user.id) return response('Valuation not available', 404);
    const audit = [...(record.audit || [])];
    if (audit.length > 400) return response('Audit history is full; contact an administrator');
    let changes = {};
    if (action === 'save') {
      if (!isManager && !isSupplierManager && user.role !== 'admin') return response('Only the project manager may edit the draft', 403);
      if (!['draft', 'returned'].includes(record.status)) return response('This valuation is locked');
      const items = input.items;
      if (!Array.isArray(items) || items.length > 100) return response('Too many schedule items');
      const cleanItems = items.map((item, index) => ({ number: index + 1, description: str(item.description, 250), contract_value: money(item.contract_value), variations: money(item.variations), previous: money(item.previous), completed: money(item.completed), materials: money(item.materials) }));
      if (cleanItems.some(i => [i.contract_value, i.variations, i.previous, i.completed, i.materials].some(n => !Number.isFinite(n) || n < 0))) return response('Schedule amounts must be valid and non-negative');
      const deductions = input.deductions;
      if (!Array.isArray(deductions) || deductions.length > 30) return response('Too many deductions');
      const cleanDeductions = deductions.map(d => ({ description: str(d.description, 120), amount: money(d.amount), notes: str(d.notes, 500) }));
      if (cleanDeductions.some(d => !Number.isFinite(d.amount) || d.amount < 0)) return response('Deduction amounts must be valid and non-negative');
      const retention = user.role === 'admin' ? money(input.retention_percent) : money(record.retention_percent);
      if (!Number.isFinite(retention) || retention < 0 || retention > 100) return response('Retention must be between 0 and 100%');
      changes = { ...(date(input.period_start) ? { period_start: date(input.period_start) } : {}), ...(date(input.period_end) ? { period_end: date(input.period_end) } : {}), ...(date(input.valuation_date) ? { valuation_date: date(input.valuation_date) } : {}), ...(date(input.payment_due_date) ? { payment_due_date: date(input.payment_due_date) } : {}), notes: str(input.notes), items: cleanItems, deductions: cleanDeductions, retention_percent: retention };
      if (changes.period_start && changes.period_end && changes.period_end < changes.period_start) return response('Period end must follow period start');
      audit.push(event('Draft updated', JSON.stringify({ period_start: record.period_start, period_end: record.period_end, items: record.items, deductions: record.deductions, retention_percent: record.retention_percent }), JSON.stringify(changes).slice(0, 5000)));
    } else if (action === 'submit') {
      if (!isManager && !isSupplierManager && user.role !== 'admin') return response('Only the project manager can submit', 403);
      if (!['draft', 'returned'].includes(record.status)) return response('This valuation cannot be submitted');
      if (!record.period_start || !record.period_end || record.period_end < record.period_start || !record.valuation_date || !(record.items || []).length) return response('Save a valid period, valuation date and at least one schedule item before submitting');
      if (record.items.some(i => !i.description || i.previous + i.completed + i.materials > i.contract_value + i.variations + 0.001) || (record.deductions || []).some(d => !d.description)) return response('Complete each schedule item and deduction; no item may exceed its revised value');
      if (!(record.attachments || []).some(file => file.type === 'NOP' && file.file_uri)) return response('Upload an NOP document before submitting');
      changes = { status: 'submitted', submitted_at: now, submitted_by: user.id, submitted_by_name: actor };
      audit.push(event(record.status === 'returned' ? 'Resubmitted' : 'Submitted', record.status, 'submitted'));
    } else if (action === 'review' || action === 'return' || action === 'reject' || action === 'approve') {
      if (!reviewers.includes(user.role)) return response('Reviewer permission required', 403);
      if (!['submitted', 'under_review'].includes(record.status)) return response('This valuation is not awaiting review');
      const comment = str(input.comment);
      if (['return', 'reject'].includes(action) && !comment) return response('A reason is required');
      if (action === 'review') changes = { status: 'under_review', reviewer_name: actor };
      if (action === 'return') changes = { status: 'returned', reviewer_name: actor, review_comments: comment };
      if (action === 'reject') changes = { status: 'rejected', reviewer_name: actor, review_comments: comment };
      if (action === 'approve') {
        const gross = (record.items || []).reduce((sum, i) => sum + money(i.previous) + money(i.completed) + money(i.materials), 0);
        const previous = await db.filter({ project_id: projectId }, '-number', 500);
        const priorCertified = Math.max(0, ...previous.filter(v => v.id !== record.id && v.number < record.number && ['approved', 'paid'].includes(v.status)).map(v => money(v.approved_gross)));
        const current = Math.max(0, money(gross - priorCertified));
        const approvedGross = input.approved_gross == null ? money(gross) : money(input.approved_gross);
        const retention = input.approved_retention == null ? money(Math.max(0, approvedGross - priorCertified) * money(record.retention_percent) / 100) : money(input.approved_retention);
        const deductions = input.approved_deductions == null ? money((record.deductions || []).reduce((sum, d) => sum + money(d.amount), 0)) : money(input.approved_deductions);
        if ([retention, deductions, approvedGross].some(n => !Number.isFinite(n) || n < 0) || approvedGross > gross || retention + deductions > approvedGross - priorCertified) return response('Approved figures must be valid and cannot exceed the submitted valuation');
        changes = { status: 'approved', reviewer_name: actor, review_comments: comment, approved_at: now, approved_by: actor, approved_gross: approvedGross, approved_retention: retention, approved_deductions: deductions, approved_net: money(approvedGross - priorCertified - retention - deductions), payment_status: 'awaiting_invoice' };
      }
      audit.push(event(action === 'review' ? 'Review started' : action === 'return' ? 'Returned for amendment' : action === 'reject' ? 'Rejected' : 'Approved', record.status, JSON.stringify({ ...changes, comment }).slice(0, 2000)));
    } else if (action === 'payment') {
      if (!['finance', 'admin'].includes(user.role)) return response('Finance permission required', 403);
      if (!['approved', 'paid'].includes(record.status)) return response('Approval required before payment');
      if (!paymentStates.includes(input.payment_status)) return response('Select a payment status');
      const amount = money(input.amount_paid);
      if (amount < 0 || !Number.isFinite(amount) || amount > money(record.approved_net)) return response('Amount paid must be within the approved net payment');
      if (input.payment_status === 'paid' && (!date(input.payment_date) || amount <= 0)) return response('Payment date and amount are required');
      changes = { payment_status: input.payment_status, ...(date(input.payment_due_date) ? { payment_due_date: date(input.payment_due_date) } : {}), payment_reference: str(input.payment_reference, 120), invoice_number: str(input.invoice_number, 120), ...(date(input.invoice_date) ? { invoice_date: date(input.invoice_date) } : {}), ...(date(input.payment_date) ? { payment_date: date(input.payment_date) } : {}), amount_paid: amount, payment_notes: str(input.payment_notes), status: input.payment_status === 'paid' ? 'paid' : 'approved' };
      audit.push(event(input.payment_status === 'paid' ? 'Marked as paid' : 'Payment updated', JSON.stringify({ payment_status: record.payment_status, payment_due_date: record.payment_due_date, payment_reference: record.payment_reference, invoice_number: record.invoice_number, invoice_date: record.invoice_date, payment_date: record.payment_date, amount_paid: record.amount_paid, payment_notes: record.payment_notes }), JSON.stringify(changes).slice(0, 2000)));
    } else if (action === 'comment') {
      const text = str(input.text, 2000);
      if (!text) return response('Write a comment');
      const comments = [...(record.comments || [])];
      if (comments.length >= 200) return response('Comment limit reached');
      comments.push({ id: crypto.randomUUID(), text, actor, organisation: isManager || isSupplierManager ? 'External Project Manager' : 'Alliance Leisure', at: now, reply_to: str(input.reply_to, 100) });
      changes = { comments };
      audit.push(event('Comment added', '', text));
    } else if (action === 'attachment') {
      if (!isManager && !isSupplierManager && user.role !== 'admin') return response('Only the project manager can attach evidence', 403);
      if (!['draft', 'returned'].includes(record.status)) return response('Evidence is locked');
      if (typeof input.file_uri !== 'string' || !input.file_uri || input.file_uri.length > 500 || (record.attachments || []).length >= 30) return response('Invalid attachment');
      changes = { attachments: [...(record.attachments || []), { file_uri: input.file_uri, name: str(input.name, 150), type: str(input.type, 100), size: Math.max(0, Number(input.size) || 0), actor, at: now }] };
      audit.push(event('Document uploaded', '', str(input.name, 150)));
    } else return response('Unknown action');
    const updated = await db.update(record.id, { ...changes, audit });
    return Response.json({ valuation: updated });
  } catch (error) {
    console.error('Valuation action failed', error);
    return Response.json({ error: error.message || 'Unable to save valuation' }, { status: 500 });
  }
}