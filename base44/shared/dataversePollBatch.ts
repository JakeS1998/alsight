import { flowRequest } from './dataverseFlowApi.ts';
import { flowSpecs, isGuid } from './dataverseFlowFields.ts';
import { flowSelection } from './dataverseFlowValues.ts';
import { prepareFlowBatch } from './dataverseFlowBatchReview.ts';
import { applyFlowUpdates } from './dataverseFlowApply.ts';
export async function pollFlowBatch(base44, context, table, settings, previous = {}, preview = false) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify([table === 'contacts' ? 'dataverse-authority-v2-skip-placeholder-email' : 'dataverse-authority-v1', context.environment, settings.logicalName, settings.mappings, Boolean(settings.dataverseOnly), settings.columnPlans || {}])));
  const fingerprint = Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
  const checkpoint = previous.fingerprint === fingerprint ? previous : {};
  const windowEnd = checkpoint.window_end || new Date(Date.now() - 30000).toISOString();
  const since = checkpoint.watermark ? new Date(Date.parse(checkpoint.watermark) - 120000).toISOString() : '';
  const select = flowSelection(settings, table);
  const filter = `${since ? `modifiedon ge ${since} and ` : ''}modifiedon le ${windowEnd}`;
  const path = checkpoint.cursor || `${settings.entitySet}?$select=${select}&$filter=${encodeURIComponent(filter)}&$orderby=modifiedon,${settings.primaryId}`;
  const address = new URL(path, `${context.environment}/api/data/v9.2/`);
  if (address.origin !== context.environment || address.pathname !== `/api/data/v9.2/${settings.entitySet}`) throw new Error('Invalid automatic sync cursor.');
  const data = await flowRequest(context.environment, context.token, path, { headers: { Prefer: 'odata.maxpagesize=50' } });
  if (!Array.isArray(data.value) || data.value.length > 50 || data.value.some(row => !isGuid(row[settings.primaryId]))) throw new Error('Dataverse returned an invalid automatic sync batch.');
  const next = data['@odata.nextLink'] || '';
  if (next) { const url = new URL(next); if (url.origin !== context.environment || url.pathname !== address.pathname) throw new Error('Invalid Dataverse continuation address.'); }
  if (preview) return { table, sampled: data.value.length, has_more: Boolean(next) };
  const { updates, counts, appliedReviews } = await prepareFlowBatch(base44, context, table, settings, data.value, true);
  await applyFlowUpdates(base44, table, flowSpecs[table], updates, appliedReviews, data.value.map(row=>row[settings.primaryId]));
  return { fingerprint, watermark: next ? checkpoint.watermark || '' : windowEnd, window_end: next ? windowEnd : '', cursor: next, last_checked_at: new Date().toISOString(), last_batch: counts, initial_scan: Boolean(next && !checkpoint.watermark), processed: (checkpoint.cursor ? checkpoint.processed || 0 : 0) + data.value.length };
}