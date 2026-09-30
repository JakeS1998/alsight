export const handoverDefinitions = [
  { key: 'pc', label: 'PC certificate', documentRequired: true },
  { key: 'om', label: 'O&M manuals', field: 'om_manuals', documentRequired: true },
  { key: 'hs', label: 'Health & Safety file', field: 'hs_file', documentRequired: true },
  { key: 'as_builts', label: 'As-built drawings', documentRequired: true },
  { key: 'warranties', label: 'Warranties', field: 'warranties_status', documentRequired: true },
  { key: 'training', label: 'Training records', field: 'training', documentRequired: true },
  { key: 'assets', label: 'Asset information', field: 'asset_info', documentRequired: true },
  { key: 'defects', label: 'Outstanding defects register' },
  { key: 'final_account', label: 'Final account status', field: 'final_account_status' },
];
export const goldenThreadGuidance = 'https://www.gov.uk/guidance/keeping-information-about-a-higher-risk-building-the-golden-thread';
export const handoverDisclaimer = 'Dataset completeness is not a compliance certificate, proof of document accuracy, confirmation that defects are resolved or that the final account is settled. The England higher-risk-building golden-thread regime may require additional building-control, fire-safety and recipient-acknowledgement records beyond this checklist.';
export function safeReference(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (trimmed.startsWith('mp/private/')) return trimmed;
  try { const url = new URL(trimmed); return url.protocol === 'https:' && !url.username && !url.password ? trimmed : ''; } catch { return ''; }
}
export async function loadHandover(base44, project, delivery) {
  const refs = [project.id, project.dataverse_id].filter(Boolean);
  const query = { project_id: { $in: refs }, status: { $ne: 'inactive' } };
  const groups = await base44.entities.Warranty.aggregate({ query, groupBy: 'date_of_execution', limit: 1000 });
  const warrantyCount = groups.rows.reduce((sum, row) => sum + row.count, 0);
  const executedCount = groups.rows.reduce((sum, row) => sum + (row.date_of_execution ? row.count : 0), 0);
  if (warrantyCount > 300 || groups.truncated) throw new Error('This project has too many warranties for one handover pack (maximum 300).');
  const warranties = []; let cursor;
  do {
    const page = await base44.entities.Warranty.filter(query, { sort: 'warranty_id', limit: 100, fields: ['warranty_id', 'link_to_file', 'date_of_execution'], ...(cursor ? { cursor } : {}) });
    warranties.push(...page.items); cursor = page.has_more ? page.next_cursor : null;
  } while (cursor);
  const items = handoverDefinitions.map(definition => {
    const saved = (delivery.handover_items || []).find(item => item.key === definition.key) || {};
    const documents = (saved.documents || []).map(file => ({ ...file, source: 'Uploaded evidence' }));
    const reference = safeReference(saved.link);
    if (reference) documents.push({ id: `${definition.key}-reference`, name: 'Handover document reference', ...(reference.startsWith('mp/private/') ? { file_uri: reference } : { link: reference }), source: 'Handover reference' });
    if (definition.key === 'pc') { const ref = safeReference(delivery.pc_certificate); if (ref) documents.push({ id: 'pc-closeout', name: 'PC certificate (close-out)', ...(ref.startsWith('mp/private/') ? { file_uri: ref } : { link: ref }), source: 'Project close-out' }); }
    if (definition.key === 'warranties') warranties.forEach(warranty => { const ref = safeReference(warranty.link_to_file); if (ref) documents.push({ id: warranty.id, name: warranty.warranty_id || 'Warranty', ...(ref.startsWith('mp/private/') ? { file_uri: ref } : { link: ref }), source: 'Warranty register' }); });
    const currentDocuments = documents.filter(file => !file.superseded);
    const hasRegister = !!safeReference(saved.register_file_uri);
    const builtEvidence = hasRegister && ['om','hs','training','assets'].includes(definition.key);
    const notes = saved.notes || (definition.key === 'defects' ? delivery.defects_period_notes : definition.key === 'final_account' ? delivery.final_account_notes : definition.field ? delivery[`${definition.field}_notes`] : '') || '';
    let automatic = definition.key === 'pc' ? (safeReference(delivery.pc_certificate) ? 'complete' : 'outstanding') : delivery[definition.field] || 'outstanding';
    if (definition.key === 'final_account') automatic = ['open', 'agreed', 'closed'].includes(delivery.final_account_status) ? 'complete' : 'outstanding';
    if (definition.key === 'warranties' && warrantyCount && executedCount === warrantyCount && warranties.every(w => safeReference(w.link_to_file))) automatic = 'complete';
    if (!['outstanding', 'partial', 'complete'].includes(automatic)) automatic = 'outstanding';
    const reviewStatus = saved.review_status || 'automatic';
    let status = reviewStatus === 'automatic' ? automatic : reviewStatus;
    let gap = status === 'complete' ? '' : 'Confirm this dataset is complete.';
    if (definition.documentRequired && !currentDocuments.length && !builtEvidence) { gap = 'Document evidence or a secure document reference is missing.'; if (status === 'complete') status = 'partial'; }
    if (definition.key === 'defects' && !notes.trim() && !hasRegister) { gap = 'Record outstanding defects, owners and actions, or explicitly confirm none.'; if (status === 'complete') status = 'partial'; }
    if (definition.key === 'final_account' && !delivery.final_account_status && !notes.trim() && !hasRegister) { gap = 'Record the final account status.'; if (status === 'complete') status = 'partial'; }
    return { ...definition, status, review_status: reviewStatus, notes, link: saved.link || '', reviewed_at: saved.reviewed_at || null, reviewed_by: saved.reviewed_by || '', register_file_uri: saved.register_file_uri || '', register_version: saved.register_version || 0, register_count: saved.register_count || 0, register_saved_by: saved.register_saved_by || '', register_saved_at: saved.register_saved_at || '', documents, gap, sourceStatus: hasRegister ? 'Portal register saved; completion review required' : definition.key === 'final_account' ? delivery.final_account_status || 'Not recorded' : automatic };
  });
  const completed = items.filter(item => item.status === 'complete').length;
  return { started: !!delivery.handover_started_at, startedAt: delivery.handover_started_at || null, startedBy: delivery.handover_started_by || '', applicability: delivery.handover_applicability || 'not_assessed', project: { id: project.id, name: project.name, number: project.project_number || '', client: project.client_name || '', pcDate: delivery.pc_achieved || project.practical_completion_date || '' }, checkedAt: new Date().toISOString(), sourceUpdatedAt: delivery.updated_date || null, items, completed, required: items.length, percentage: Math.round(completed / items.length * 100), warrantyCount, executedCount, audit: delivery.handover_audit || [], disclaimer: handoverDisclaimer, guidance: goldenThreadGuidance };
}