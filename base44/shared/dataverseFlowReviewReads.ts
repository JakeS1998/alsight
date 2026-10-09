import { flowSpecs, isGuid } from './dataverseFlowFields.ts';
import { flowRequest } from './dataverseFlowApi.ts';
import { flowSelection, mappedFlowValues, reviewScope, normalisedEmail } from './dataverseFlowValues.ts';
import { resolveFlowStaffReferences } from './dataverseFlowStaffReferences.ts';
import { staffEmailQuery } from './staffReportingIdentity.ts';
import {withPortalUserNames} from './portalUserNames.ts';
export async function checkedFlowReview(base44, context, table, settings, id) {
  if (typeof id !== 'string' || id.length > 100) throw new Error('Choose a review record.');
  const review = await base44.entities.DataverseSyncReview.get(id), scope = reviewScope(context, table, settings);
  if (!review || Object.entries(scope).some(([key, value]) => review[key] !== value) || !isGuid(review.source_id)) throw new Error('This review belongs to an older mapping. Reload the review queue.');
  return review;
}
export async function readReviewSource(context, table, settings, review) {
  return await flowRequest(context.environment, context.token, `${settings.entitySet}(${review.source_id})?$select=${flowSelection(settings, table)}`);
}
export async function checkedReviewTarget(base44, table, review, targetId, row) {
  if (typeof targetId !== 'string' || !targetId || targetId.length > 100) throw new Error('Choose an existing ALSight record.');
  const spec = flowSpecs[table], identity = spec.identityField || 'dataverse_id';
  const target = await base44.entities[spec.entity].get(targetId);
  if (!target || (target[identity] && target[identity].toLowerCase() !== review.source_id.toLowerCase())) throw new Error('This ALSight record is already linked to a different Dataverse record.');
  if (table === 'users' && (!normalisedEmail(row.internalemailaddress) || normalisedEmail(target.email) !== normalisedEmail(row.internalemailaddress))) throw new Error('System users may only link to an existing portal user with the exact same email.');
  return target;
}
export async function flowReviewDetails(base44, context, table, settings, input) {
  const review = await checkedFlowReview(base44, context, table, settings, input.reviewId), row = await readReviewSource(context, table, settings, review);
  const resolved = (await resolveFlowStaffReferences(base44, table, [mappedFlowValues(table, settings, row)]))[0];
  if (resolved.error) throw new Error(resolved.error);
  const target = input.targetId ? await checkedReviewTarget(base44, table, review, input.targetId, row) : null;
  return { review, values: resolved.value, etag: row['@odata.etag'], localUpdatedAt: target?.updated_date, local: target ? Object.fromEntries(settings.mappings.map(mapping => [mapping.local, target[mapping.local] ?? null])) : null };
}
export async function searchReviewTargets(base44, context, table, settings, input) {
  const review = await checkedFlowReview(base44, context, table, settings, input.reviewId), spec = flowSpecs[table], identity = spec.identityField || 'dataverse_id';
  if (table === 'users') {
    const row = await readReviewSource(context, table, settings, review), email = normalisedEmail(row.internalemailaddress);
    const users = email ? await withPortalUserNames(base44.entities,await base44.entities.User.filter({ email: staffEmailQuery(email) })) : [];
    return { items: users.filter(user => !user[identity] || user[identity] === review.source_id).map(user => ({ id: user.id, label: `${user.full_name || user.email} · ${user.email}` })), has_more: false };
  }
  const search = typeof input.search === 'string' ? input.search.trim().slice(0, 100) : '';
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const query = { $and: [{ $or: [{ [identity]: { $exists: false } }, { [identity]: { $in: [null, '', review.source_id] } }] }, ...(escaped ? [{ $or: (spec.matchFields || [spec.required]).map(field => ({ [field]: { $regex: escaped, $options: 'i' } })) }] : [])] };
  const page = await base44.entities[spec.entity].filter(query, { limit: 20, sort: spec.required, fields: [spec.required], ...(typeof input.cursor === 'string' && input.cursor.length < 4000 ? { cursor: input.cursor } : {}) });
  return { ...page, items: page.items.map(record => ({ id: record.id, label: record[spec.required] || record.id })) };
}