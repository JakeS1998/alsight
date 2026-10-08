import { flowRequest } from './dataverseFlowApi.ts';
import { flowSpecs, isGuid } from './dataverseFlowFields.ts';
import { flowSelection } from './dataverseFlowValues.ts';
import { prepareFlowBatch } from './dataverseFlowBatchReview.ts';
import { applyFlowUpdates } from './dataverseFlowApply.ts';
export async function syncFlowBatch(base44, context, table, config, restart) {
  const settings = config.tables?.[table], spec = flowSpecs[table];
  if (!settings?.mappings?.length) throw new Error('Confirm the table mapping before synchronising.');
  const select = flowSelection(settings, table);
  const path = !restart && settings.cursor ? settings.cursor : `${settings.entitySet}?$select=${select}&$orderby=${settings.primaryId}`;
  const parsed = new URL(path, `${context.environment}/api/data/v9.2/`);
  if (parsed.pathname !== `/api/data/v9.2/${settings.entitySet}`) throw new Error('Invalid synchronisation cursor. Start again.');
  const data = await flowRequest(context.environment, context.token, path, { headers: { Prefer: 'odata.maxpagesize=50' } });
  if (!Array.isArray(data.value) || data.value.length > 50) throw new Error('Dataverse returned an unexpectedly large batch.');
  if (data.value.some(row => !isGuid(row[settings.primaryId]))) throw new Error('Dataverse returned an invalid record identity.');
  const { updates, counts, appliedReviews } = await prepareFlowBatch(base44, context, table, settings, data.value);
  await applyFlowUpdates(base44, table, spec, updates, appliedReviews);
  const next = data['@odata.nextLink'] || '';
  if (next && (new URL(next).origin !== context.environment || new URL(next).pathname !== `/api/data/v9.2/${settings.entitySet}`)) throw new Error('Dataverse returned an invalid continuation address.');
  const tables = { ...config.tables, [table]: { ...settings, cursor: next, last_synced_at: new Date().toISOString(), processed: (restart ? 0 : settings.processed || 0) + data.value.length, updated: (restart ? 0 : settings.updated || 0) + counts.updated, queued: (restart ? 0 : settings.queued || 0) + counts.pending + counts.unmatched + counts.errors, last_batch: counts, complete: !next } };
  await base44.asServiceRole.entities.DataverseFlowConfig.update(config.id, { tables });
  return { updated: counts.updated, queued: counts.pending + counts.unmatched + counts.errors, processed: data.value.length, has_more: Boolean(next), tables, notice: `${data.value.length} source records scanned; ${counts.updated} linked records refreshed; ${counts.pending + counts.unmatched + counts.errors} need review. Unmapped fields were preserved.` };
}