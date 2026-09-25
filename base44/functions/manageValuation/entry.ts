import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

const response = (message, status = 400) => Response.json({ error: message }, { status });
const money = (n) => Math.round((Number(n) || 0) * 100) / 100;
const date = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
const str = (s, max = 2000) => typeof s === 'string' ? s.trim().slice(0, max) : '';
const internal = ['admin', 'director', 'regional_director', 'bsm', 'bdm', 'finance'];
const reviewers = ['admin', 'director', 'bsm', 'bdm'];
const paymentStates = ['awaiting_invoice', 'invoice_received', 'approved_for_payment', 'scheduled', 'paid', 'on_hold'];

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return response('Sign in required', 401);
    const input = await req.json();
    const { action, projectId, valuationId } = input;
    if (!projectId || typeof projectId !== 'string') return response('Project required');
    const project = await base44.entities.Project.get(projectId).catch(() => null);
    if (!project) return response('Project not available', 403);
    const contactId = user.contact_dataverse_id || user.data?.contact_dataverse_id;
    const isManager = user.role === 'project_manager' && !!contactId && project.project_manager_id === contactId;
    if (!isManager && !internal.includes(user.role)) return response('Not authorised for valuations', 403);
    const actor = user.full_name || user.email;
    const now = new Date().toISOString();
    const db = base44.asServiceRole.entities.Valuation;
    const event = (kind, previous = '', next = '') => ({ kind, actor, actor_id: user.id, organisation: isManager ? 'External Project Manager' : 'Alliance Leisure', at: now, previous, next });
    if (action === 'create') {
      if (!isManager && user.role !== 'admin') return response('Only the assigned project manager can create a valuation', 403);
      const existing = await db.filter({ project_id: projectId }, '-number', 500);
      const number = Math.max(0, ...existing.map(v => Number(v.number) || 0)) + 1;
      const record = await db.create({ project_id: projectId, project_manager_contact_id: project.project_manager_id || '', bdm_aad_id: project.bdm_aad_id || '', bsm_aad_id: project.bsm_aad_id || '', department_id: project.department_id || '', number, status: 'draft', items: [], deductions: [], attachments: [], comments: [], audit: [event('Created', '', `Valuation ${number}`)], retention_percent: 0, payment_status: 'awaiting_invoice' });
      return Response.json({ valuation: record });
    }
    if (!valuationId || typeof valuationId !== 'string') return response('Valuation required');
    const record = await db.get(valuationId).catch(() => null);
    if (!record || record.project_id !== projectId) return response('Valuation not available', 404);
    const audit = [...(record.audit || [])];
    if (audit.length > 400) return response('Audit history is full; contact an administrator');
    let changes = {};
    if (action === 'save') {
      if (!isManager && user.role !== 'admin') return response('Only the project manager may edit the draft', 403);
      if (!['draft', 'returned'].includes(record.status)) return response('This valuation is locked');
      const items = input.items;
      if (!Array.isArray(items) || items.length > 100) return response('Too many schedule items');
      const cleanItems = items.map((item, index) => ({ number: index + 1, description: str(item.description, 250), contract_value: money(item.contract_value), variations: money(item.variations), previous: money(item.previous), completed: money(item.completed), materials: money(item.materials) }));
      if (cleanItems.some(i => !i.description || [i.contract_value, i.variations, i.previous, i.completed, i.materials].some(n => !Number.isFinite(n) || n < 0) || i.previous + i.completed + i.materials > i.contract_value + i.variations + 0.001)) return response('Complete each item and keep its total within its revised value');
      const deductions = input.deductions;
      if (!Array.isArray(deductions) || deductions.length > 30) return response('Too many deductions');
      const cleanDeductions = deductions.map(d => ({ description: str(d.description, 120), amount: money(d.amount), notes: str(d.notes, 500) }));
      if (cleanDeductions.some(d => !d.description || !Number.isFinite(d.amount) || d.amount < 0)) return response('Each deduction needs a description and valid amount');
      const retention = money(input.retention_percent);
      if (!Number.isFinite(retention) || retention < 0 || retention > 100) return response('Retention must be between 0 and 100%');
      changes = { period_start: date(input.period_start), period_end: date(input.period_end), valuation_date: date(input.valuation_date), payment_due_date: date(input.payment_due_date), notes: str(input.notes), items: cleanItems, deductions: cleanDeductions, retention_percent: retention };
      if (changes.period_start && changes.period_end && changes.period_end < changes.period_start) return response('Period end must follow period start');
      audit.push(event('Draft updated', JSON.stringify({ period_start: record.period_start, period_end: record.period_end, items: record.items, deductions: record.deductions, retention_percent: record.retention_percent }), JSON.stringify(changes).slice(0, 5000)));
    } else if (action === 'submit') {
      if (!isManager && user.role !== 'admin') return response('Only the project manager can submit', 403);
      if (!['draft', 'returned'].includes(record.status)) return response('This valuation cannot be submitted');
      if (!record.period_start || !record.period_end || !record.valuation_date || !(record.items || []).length) return response('Save the period, valuation date and at least one schedule item before submitting');
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
        const priorCertified = previous.filter(v => v.id !== record.id && v.number < record.number && ['approved', 'paid'].includes(v.status)).reduce((sum, v) => sum + money(v.approved_gross), 0);
        const current = Math.max(0, money(gross - priorCertified));
        const retention = input.approved_retention == null ? money(current * money(record.retention_percent) / 100) : money(input.approved_retention);
        const deductions = input.approved_deductions == null ? money((record.deductions || []).reduce((sum, d) => sum + money(d.amount), 0)) : money(input.approved_deductions);
        const approvedGross = input.approved_gross == null ? money(gross) : money(input.approved_gross);
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
      changes = { payment_status: input.payment_status, payment_due_date: date(input.payment_due_date), payment_reference: str(input.payment_reference, 120), invoice_number: str(input.invoice_number, 120), invoice_date: date(input.invoice_date), payment_date: date(input.payment_date), amount_paid: amount, payment_notes: str(input.payment_notes), status: input.payment_status === 'paid' ? 'paid' : 'approved' };
      audit.push(event(input.payment_status === 'paid' ? 'Marked as paid' : 'Payment updated', JSON.stringify({ status: record.payment_status, amount: record.amount_paid }), JSON.stringify(changes).slice(0, 2000)));
    } else if (action === 'comment') {
      const text = str(input.text, 2000);
      if (!text) return response('Write a comment');
      const comments = [...(record.comments || [])];
      if (comments.length >= 200) return response('Comment limit reached');
      comments.push({ id: crypto.randomUUID(), text, actor, organisation: isManager ? 'External Project Manager' : 'Alliance Leisure', at: now, reply_to: str(input.reply_to, 100) });
      changes = { comments };
      audit.push(event('Comment added', '', text));
    } else if (action === 'attachment') {
      if (!isManager && user.role !== 'admin') return response('Only the project manager can attach evidence', 403);
      if (!['draft', 'returned'].includes(record.status)) return response('Evidence is locked');
      if (typeof input.file_uri !== 'string' || !input.file_uri.startsWith('base44://') || (record.attachments || []).length >= 30) return response('Invalid attachment');
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