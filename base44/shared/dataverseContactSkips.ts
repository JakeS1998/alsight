import { normalisedEmail, reviewScope } from './dataverseFlowValues.ts';
export async function skipPlaceholderContacts(base44, context, table, settings, rows) {
  if (table !== 'contacts') return { rows, skipped: 0 };
  const emailFields = [...new Set(['emailaddress1', 'emailaddress2', 'emailaddress3', ...settings.mappings.filter(m => /^email[23]?$/.test(m.local)).map(m => m.queryName || m.source)])];
  const skipped = rows.filter(row => emailFields.some(field => normalisedEmail(row[field]) === 'change me'));
  if (!skipped.length) return { rows, skipped: 0 };
  const scope = reviewScope(context, table, settings);
  await base44.entities.DataverseSyncReview.upsert(skipped.map(row => {
    const sourceId = row[settings.primaryId];
    return { review_key: `${context.environment}|${table}|${scope.mapping_revision}|${sourceId}`, ...scope, source_id: sourceId, source_label: String(row[settings.primaryName] || sourceId).slice(0, 200), source_email: 'change me', status: 'rejected', candidates: [], preview: { email: 'CHANGE ME', skip_reason: 'Placeholder email, skipped during sync.' }, error: '' };
  }), { key: 'review_key' });
  const skippedIds = new Set(skipped.map(row => row[settings.primaryId]));
  return { rows: rows.filter(row => !skippedIds.has(row[settings.primaryId])), skipped: skipped.length };
}