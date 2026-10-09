import { flowSpecs } from './dataverseFlowFields.ts';
import { reviewScope, mappedFlowValues } from './dataverseFlowValues.ts';
import { checkedFlowReview, readReviewSource, checkedReviewTarget } from './dataverseFlowReviewReads.ts';
import { resolveFlowStaffReferences } from './dataverseFlowStaffReferences.ts';
import { accountFlowValues } from './dataverseAccountValues.ts';
import { resolveInsuranceReferences } from './supplierInsuranceReferences.ts';
export async function listFlowReviews(base44, context, table, settings, input) {
  const scope = reviewScope(context, table, settings), allowed = ['pending', 'unmatched', 'approved', 'rejected', 'applied', 'error'];
  const query = { ...scope, ...(allowed.includes(input.status) ? { status: input.status } : {}) };
  const [page, summary] = await Promise.all([
    base44.entities.DataverseSyncReview.filter(query, { sort: '-updated_date', limit: 20, ...(typeof input.cursor === 'string' && input.cursor.length < 4000 ? { cursor: input.cursor } : {}) }),
    base44.entities.DataverseSyncReview.aggregate({ query: scope, groupBy: 'status' })
  ]);
  return { ...page, counts: Object.fromEntries(summary.rows.map(row => [row.status, row.count])) };
}
export async function decideFlowReview(base44, user, context, table, settings, input) {
  const review = await checkedFlowReview(base44, context, table, settings, input.reviewId);
  if (!['approve', 'reject', 'reopen'].includes(input.decision)) throw new Error('Choose a review decision.');
  if (input.decision === 'reopen') {
    if (review.status !== 'rejected') throw new Error('Only a rejected match can be reopened.');
    await base44.entities.DataverseSyncReview.update(review.id, { status: review.candidates?.length ? 'pending' : 'unmatched', error: '' });
    return { notice: 'Match returned to the review queue.' };
  }
  if (!['pending', 'unmatched', 'error', 'approved'].includes(review.status)) throw new Error('This match has already been decided. Reload the queue.');
  const decision = { reviewed_by: user.id, reviewed_at: new Date().toISOString() };
  if (input.decision === 'reject') {
    await base44.entities.DataverseSyncReview.update(review.id, { ...decision, status: 'rejected', error: '' });
    return { notice: 'Rejected. The ALSight placeholder is unchanged.' };
  }
  const row = await readReviewSource(context, table, settings, review);
  if (typeof input.etag !== 'string' || !/^W\/"[0-9]+"$/.test(input.etag) || row['@odata.etag'] !== input.etag) { const error = new Error('The source changed or was not previewed. Reload the comparison before approving.'); error.status = 412; throw error; }
  const target = await checkedReviewTarget(base44, table, review, input.targetId, row), spec = flowSpecs[table], identity = spec.identityField || 'dataverse_id';
  if (typeof input.localUpdatedAt !== 'string' || input.localUpdatedAt !== target.updated_date) { const error = new Error('The ALSight record changed since the comparison. Reload before approving.'); error.status = 412; throw error; }
  const linked = table === 'users' ? await base44.entities.User.filter({ [identity]: review.source_id }) : (await base44.entities[spec.entity].filter({ [identity]: review.source_id }, { limit: 2, fields: [spec.required] })).items;
  if (linked.some(record => record.id !== target.id)) throw new Error('This source record is already linked to another ALSight record.');
  const resolved = (await resolveFlowStaffReferences(base44, table, [mappedFlowValues(table, settings, row)], context))[0];
  if (resolved.error) throw new Error(resolved.error);
  const account = accountFlowValues(table, resolved.value, target, !settings.dataverseOnly || settings.columnPlans?.account_type === 'base44_only');
  if (account.error) throw new Error(account.error);
  const insurance = (await resolveInsuranceReferences(base44, table, [account.value]))[0];
  if (insurance.error) throw new Error(insurance.error);
  resolved.value = insurance.value;
  await base44.entities.DataverseSyncReview.update(review.id, { ...decision, target_id: target.id, status: 'approved', error: '' });
  try {
    await base44.entities[spec.entity].update(target.id, { ...resolved.value, [identity]: review.source_id });
    await base44.entities.DataverseSyncReview.update(review.id, { status: 'applied', applied_at: new Date().toISOString() });
  } catch (error) {
    await base44.entities.DataverseSyncReview.update(review.id, { status: 'error', error: String(error.message).slice(0, 500) });
    throw error;
  }
  return { notice: settings.dataverseOnly ? 'Approved and refreshed from Dataverse. Base44-only fields were preserved; unmapped source fields were cleared.' : 'Approved and refreshed from Dataverse. Unmapped fields were preserved.' };
}