import { flowSpecs } from './dataverseFlowFields.ts';
import { mappedFlowValues, reviewScope, normalisedEmail } from './dataverseFlowValues.ts';
import { findFlowTargets, matchingFlowTargets } from './dataverseFlowMatching.ts';
import { resolveFlowStaffReferences } from './dataverseFlowStaffReferences.ts';
export async function prepareFlowBatch(base44, context, table, settings, rows) {
  const spec = flowSpecs[table], scope = reviewScope(context, table, settings), identity = spec.identityField || 'dataverse_id';
  const values = [], errors = [];
  for (const row of rows) {
    try { values.push(mappedFlowValues(table, settings, row)); errors.push(''); }
    catch (error) { values.push(null); errors.push(error.message); }
  }
  const resolved = await resolveFlowStaffReferences(base44, table, values);
  const targets = await findFlowTargets(base44, table, settings, rows, values);
  const previous = rows.length ? await base44.entities.DataverseSyncReview.filter({ ...scope, source_id: { $in: rows.map(row => row[settings.primaryId]) } }, { limit: 100 }) : { items: [] };
  if (previous.has_more) throw new Error('Duplicate review records need administrator attention.');
  const updates = [], reviews = [], appliedReviews = [], counts = { updated: 0, pending: 0, unmatched: 0, rejected: 0, errors: 0 };
  rows.forEach((row, index) => {
    const sourceId = row[settings.primaryId], old = previous.items.find(review => review.source_id === sourceId);
    if (old?.status === 'rejected') { counts.rejected++; return; }
    const linked = targets.filter(target => target[identity]?.toLowerCase() === sourceId.toLowerCase() && (table !== 'users' || normalisedEmail(target.email) === normalisedEmail(row.internalemailaddress)));
    const error = errors[index] || resolved[index].error || (linked.length > 1 ? 'Multiple ALSight records have this Dataverse ID.' : '');
    if (linked.length === 1 && !error && (!old || old.status === 'applied' || (old.status === 'error' && old.target_id === linked[0].id))) {
      updates.push({ id: linked[0].id, ...resolved[index].value, [identity]: sourceId });
      if (old) appliedReviews.push(old.id);
      counts.updated++; return;
    }
    const matches = linked.length ? linked : matchingFlowTargets(table, row, values[index], targets);
    const status = error ? 'error' : old && ['approved', 'pending', 'unmatched', 'error'].includes(old.status) ? (matches.length ? 'pending' : 'unmatched') : matches.length ? 'pending' : 'unmatched';
    counts[status === 'error' ? 'errors' : status]++;
    const candidateList = matches.slice(0, 10).map(target => ({ id: target.id, label: String(target[spec.labelField || spec.required] || target.email || target.id).slice(0, 200) }));
    reviews.push({ review_key: `${context.environment}|${table}|${scope.mapping_revision}|${sourceId}`, ...scope, source_id: sourceId, source_label: String(row[settings.primaryName] || values[index]?.[spec.required] || sourceId).slice(0, 200), source_email: table === 'users' ? normalisedEmail(row.internalemailaddress) : '', status, ...(old?.target_id ? { target_id: old.target_id } : linked.length === 1 ? { target_id: linked[0].id } : {}), candidates: candidateList, preview: Object.fromEntries(Object.entries(values[index] || {}).slice(0, 6).map(([key, value]) => [key, typeof value === 'string' ? value.slice(0, 160) : value])), error: String(error).slice(0, 500) });
  });
  if (reviews.length) await base44.entities.DataverseSyncReview.upsert(reviews, { key: 'review_key' });
  return { updates, counts, appliedReviews };
}