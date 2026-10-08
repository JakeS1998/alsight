import { flowRequest } from './dataverseFlowApi.ts';
import { flowSpecs, isGuid, validateFlowValue } from './dataverseFlowFields.ts';
export async function syncFlowBatch(base44, context, table, config, restart) {
  const settings = config.tables?.[table], spec = flowSpecs[table];
  if (!settings?.mappings?.length) throw new Error('Confirm the table mapping before synchronising.');
  const select = [...new Set([settings.primaryId, ...settings.mappings.map(m => m.source)])].join(',');
  const path = !restart && settings.cursor ? settings.cursor : `${settings.entitySet}?$select=${select}&$orderby=${settings.primaryId}`;
  const parsed = new URL(path, `${context.environment}/api/data/v9.2/`);
  if (parsed.pathname !== `/api/data/v9.2/${settings.entitySet}`) throw new Error('Invalid synchronisation cursor. Start again.');
  const data = await flowRequest(context.environment, context.token, path, { headers: { Prefer: 'odata.maxpagesize=50' } });
  if (!Array.isArray(data.value) || data.value.length > 50) throw new Error('Dataverse returned an unexpectedly large batch.');
  const records = data.value.map(row => {
    if (!isGuid(row[settings.primaryId])) throw new Error('Dataverse returned an invalid record identity.');
    const record = { dataverse_id: row[settings.primaryId] };
    for (const mapping of settings.mappings) record[mapping.local] = validateFlowValue(mapping.localType, row[mapping.source] ?? null, mapping.local === spec.required);
    return record;
  });
  // Updating by the external key preserves ALSight IDs and every unmapped local field.
  const result = records.length ? await base44.asServiceRole.entities[spec.entity].upsert(records, { key: 'dataverse_id' }) : { created: 0, updated: 0 };
  const next = data['@odata.nextLink'] || '';
  if (next && (new URL(next).origin !== context.environment || new URL(next).pathname !== `/api/data/v9.2/${settings.entitySet}`)) throw new Error('Dataverse returned an invalid continuation address.');
  const tables = { ...config.tables, [table]: { ...settings, cursor: next, last_synced_at: new Date().toISOString(), processed: (restart ? 0 : settings.processed || 0) + records.length, complete: !next } };
  await base44.asServiceRole.entities.DataverseFlowConfig.update(config.id, { tables });
  return { created: result.created, updated: result.updated, processed: records.length, has_more: Boolean(next), tables };
}