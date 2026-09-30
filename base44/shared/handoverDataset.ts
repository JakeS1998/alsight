import { handoverDefinitions, complianceFields, complianceGaps } from './handoverRequirements.ts';
import { loadProjectWarrantySchedule } from './handoverWarranties.ts';
export { handoverDefinitions } from './handoverRequirements.ts';
export const goldenThreadGuidance = 'https://www.gov.uk/guidance/keeping-information-about-a-higher-risk-building-the-golden-thread';
export const handoverDisclaimer = 'England baseline only, not a compliance certificate or an exhaustive legal checklist. A competent project dutyholder must confirm work scope, transitional provisions, information sufficiency and deadlines; specialist plant, fire, water-treatment, electricity-generation and overheating duties may add requirements. Readiness is recorded-evidence readiness, not legal permission to occupy, a PC certificate, proof that defects are resolved or that the final account is settled. Higher-risk-building projects need a separate full BSR/golden-thread assessment; this baseline cannot clear their gateway.';
export function safeReference(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (trimmed.startsWith('mp/private/')) return trimmed;
  try { const url = new URL(trimmed); return url.protocol === 'https:' && !url.username && !url.password ? trimmed : ''; } catch { return ''; }
}
export async function loadHandover(base44, project, delivery) {
  const decisionsPage = await base44.entities.HandoverApplicabilityDecision.filter({ project_id: project.id }, { sort: '-decided_at', limit: 50 });
  const decisionFor = key => decisionsPage.items.find(row => row.item_key === key && row.reason?.trim().length >= 10 && row.decided_by && row.decided_at) || null;
  const goldenThreadDecision = decisionFor('golden_thread');
  const { warranties, warrantyCount, completedWarrantyCount, executedCount } = await loadProjectWarrantySchedule(base44, project);
  const linkedWarranties = warranties.map(warranty => {
    const reference = safeReference(warranty.link_to_file);
    return { id: warranty.id, name: warranty.warranty_id || 'Warranty', services: warranty.services || '', completed: warranty.completed, completionLabel: warranty.completionLabel, ...(reference.startsWith('mp/private/') ? { file_uri: reference } : { link: reference }) };
  });
  const items = handoverDefinitions.map(definition => {
    const saved = (delivery.handover_items || []).find(item => item.key === definition.key) || {};
    const documents = definition.key === 'warranties' ? [] : (saved.documents || []).map(file => ({ ...file, source: 'Uploaded evidence' }));
    const reference = definition.key === 'warranties' ? '' : safeReference(saved.link);
    if (reference) documents.push({ id: `${definition.key}-reference`, name: 'Handover document reference', ...(reference.startsWith('mp/private/') ? { file_uri: reference } : { link: reference }), source: 'Handover reference' });
    if (definition.key === 'pc') { const ref = safeReference(delivery.pc_certificate); if (ref) documents.push({ id: 'pc-closeout', name: 'PC certificate (close-out)', ...(ref.startsWith('mp/private/') ? { file_uri: ref } : { link: ref }), source: 'Project close-out' }); }
    if (definition.key === 'warranties') warranties.forEach(warranty => { const ref = safeReference(warranty.link_to_file); if (ref) documents.push({ id: warranty.id, name: warranty.warranty_id || 'Warranty', ...(ref.startsWith('mp/private/') ? { file_uri: ref } : { link: ref }), source: 'Warranty register' }); });
    const currentDocuments = documents.filter(file => !file.superseded);
    const hasRegister = !!safeReference(saved.register_file_uri);
    const builtEvidence = hasRegister && ['om','training','assets'].includes(definition.key);
    const notes = saved.notes || (definition.key === 'defects' ? delivery.defects_period_notes : definition.key === 'final_account' ? delivery.final_account_notes : definition.field ? delivery[`${definition.field}_notes`] : '') || '';
    let automatic = definition.key === 'pc' ? (safeReference(delivery.pc_certificate) ? 'complete' : 'outstanding') : delivery[definition.field] || 'outstanding';
    if (definition.key === 'final_account') automatic = ['open', 'agreed', 'closed'].includes(delivery.final_account_status) ? 'complete' : 'outstanding';
    if (definition.key === 'warranties') automatic = warrantyCount > 0 && completedWarrantyCount === warrantyCount ? 'complete' : completedWarrantyCount > 0 ? 'partial' : 'outstanding';
    if (!['outstanding', 'partial', 'complete'].includes(automatic)) automatic = 'outstanding';
    const reviewStatus = saved.review_status || 'automatic';
    let status = definition.key === 'warranties' || reviewStatus === 'automatic' ? automatic : reviewStatus;
    let gap = status === 'complete' ? '' : 'Confirm this dataset is complete.';
    if (definition.key === 'warranties' && status !== 'complete') gap = warrantyCount ? 'All linked warranties must be sealed, executed or recorded as a product warranty.' : 'No active warranties are linked to this project.';
    if (definition.documentRequired && definition.key !== 'warranties' && !currentDocuments.length && !builtEvidence) { gap = 'Document evidence or a secure document reference is missing.'; if (status === 'complete') status = 'partial'; }
    if (definition.key === 'defects' && !notes.trim() && !hasRegister) { gap = 'Record outstanding defects, owners and actions, or explicitly confirm none.'; if (status === 'complete') status = 'partial'; }
    if (definition.key === 'final_account' && !delivery.final_account_status && !notes.trim() && !hasRegister) { gap = 'Record the final account status.'; if (status === 'complete') status = 'partial'; }
    const parentDecision = definition.applicabilityParentKey ? decisionFor(definition.applicabilityParentKey) : null;
    const decision = definition.statutory ? parentDecision?.value === 'does_not_apply' ? { ...parentDecision, inherited_from: handoverDefinitions.find(parent => parent.key === definition.applicabilityParentKey).label } : decisionFor(definition.key) : null;
    const assessed = !definition.statutory || decision?.value === 'applies' || decision?.value === 'does_not_apply';
    const excluded = decision?.value === 'does_not_apply';
    const retainsContract = ['om','assets','as_builts','training'].includes(definition.key);
    const gaps = !excluded ? complianceGaps(definition.key, saved.compliance_details) : [];
    if (definition.statutory && !assessed) { gap = 'Authorised applicability assessment is missing. ' + gap; if (status === 'complete') status = 'partial'; }
    if (gaps.length) { gap = `Missing issue / receipt information: ${gaps.join('; ')}. ` + gap; if (status === 'complete') status = 'partial'; }
    if (excluded && !retainsContract) { status = 'not_applicable'; gap = ''; }
    if (excluded && retainsContract) gap = (status === 'complete' ? '' : gap) + ' Statutory content assessed not applicable; contractual deliverable still required.';
    return { ...definition, ...(definition.key === 'warranties' ? { linked_warranties: linkedWarranties, warranty_count: warrantyCount, completed_warranty_count: completedWarrantyCount } : {}), statutoryRequired: definition.statutory && !excluded, decision, compliance_details: saved.compliance_details || {}, complianceFields: excluded ? [] : complianceFields[definition.key] || [], status, review_status: reviewStatus, notes, link: saved.link || '', reviewed_at: saved.reviewed_at || null, reviewed_by: saved.reviewed_by || '', register_file_uri: saved.register_file_uri || '', register_version: saved.register_version || 0, register_count: saved.register_count || 0, register_saved_by: saved.register_saved_by || '', register_saved_at: saved.register_saved_at || '', documents, gap, sourceStatus: hasRegister ? 'Portal register saved; completion review required' : definition.key === 'final_account' ? delivery.final_account_status || 'Not recorded' : automatic };
  });
  const completed = items.filter(item => item.status === 'complete').length;
  const notApplicable = items.filter(item => item.status === 'not_applicable').length;
  const required = items.length - notApplicable;
  const goldenThreadBlocked = goldenThreadDecision?.value !== 'does_not_apply';
  const statutoryOutstanding = items.filter(item => item.statutoryRequired && item.status !== 'complete').length + (goldenThreadBlocked ? 1 : 0);
  const contractualOutstanding = items.filter(item => !item.statutoryRequired && item.classification !== 'project' && !['complete','not_applicable'].includes(item.status)).length;
  const projectOutstanding = items.filter(item => item.classification === 'project' && item.status !== 'complete').length;
  return { ready: completed === required && !goldenThreadBlocked, statutoryOutstanding, contractualOutstanding, projectOutstanding, notApplicable, goldenThreadDecision, started: !!delivery.handover_started_at, startedAt: delivery.handover_started_at || null, startedBy: delivery.handover_started_by || '', applicability: goldenThreadDecision?.value || 'not_assessed', project: { id: project.id, name: project.name, number: project.project_number || '', client: project.client_name || '', pcDate: delivery.pc_achieved || project.practical_completion_date || '' }, checkedAt: new Date().toISOString(), sourceUpdatedAt: delivery.updated_date || null, items, completed, required, percentage: required ? Math.round(completed / required * 100) : 100, warrantyCount, executedCount, audit: delivery.handover_audit || [], disclaimer: handoverDisclaimer, guidance: goldenThreadGuidance };
}