import { flowRequest } from './dataverseFlowApi.ts';
import { flowSelection, mappedFlowValues } from './dataverseFlowValues.ts';
import { isGuid } from './dataverseFlowFields.ts';
import { dmaSourceBlanks } from './dataverseDMASource.ts';
import { resolveFlowStaffReferences } from './dataverseFlowStaffReferences.ts';
export async function cleanDataverseDMA(base44, context, config, preview = true) {
  const settings = config.tables?.dma;
  if (!settings?.mappings?.length) throw new Error('Confirm the DMA mapping first.');
  const local = await base44.entities.DMA.filter({}, { limit: 1000 });
  if (local.has_more) throw new Error('DMA cleanup exceeds the safe one-pass limit. No records were removed.');
  const live = new Map(), warnings = new Set();
  let path = `${settings.entitySet}?$select=${flowSelection(settings, 'dma')}`;
  for (let page = 0; path && page < 20; page++) {
    const data = await flowRequest(context.environment, context.token, path, { headers: { Prefer: 'odata.maxpagesize=100' } });
    if (!Array.isArray(data.value) || data.value.some(row => !isGuid(row[settings.primaryId]))) throw new Error('Invalid DMA source data. Cleanup stopped.');
    for (const row of data.value) live.set(row[settings.primaryId].toLowerCase(), row);
    path = data['@odata.nextLink'] || '';
    if (path && new URL(path).pathname !== `/api/data/v9.2/${settings.entitySet}`) throw new Error('Invalid DMA continuation.');
  }
  if (path || !live.size) throw new Error('A complete, non-empty Dataverse DMA scan is required before cleanup.');
  const remove = local.items.filter(record => !live.has(record.dataverse_id?.toLowerCase()));
  const retained = local.items.filter(record => live.has(record.dataverse_id?.toLowerCase()));
  const updates = [];
  for (const record of retained) {
    const row = live.get(record.dataverse_id.toLowerCase()), values = dmaSourceBlanks(settings);
    for (const mapping of settings.mappings) {
      try { Object.assign(values, mappedFlowValues('dma', { ...settings, mappings: [mapping], dataverseOnly: false }, row)); }
      catch (error) { values[mapping.local] = ['String', 'Memo', 'Lookup'].includes(mapping.localType) ? '' : null; warnings.add(error.message); }
    }
    if (!values.document_id) throw new Error('A DMA document ID is missing in Dataverse. Cleanup stopped.');
    updates.push({ id: record.id, ...values });
  }
  const resolved = await resolveFlowStaffReferences(base44, 'dma', updates);
  resolved.forEach((item, index) => {
    if (!item.error) updates[index] = item.value;
    else {
      for (const key of Object.keys(updates[index]).filter(key => key.endsWith('_aad_id'))) delete updates[index][key];
      warnings.add(item.error);
    }
  });
  const result = { source_rows: live.size, refreshed: updates.length, removed: remove.length, warnings: [...warnings] };
  if (preview) return { ...result, preview: true };
  await base44.entities.DataverseFlowConfig.update(config.id, { tables: { ...config.tables, dma: { ...settings, dataverseOnly: true } } });
  for (let i = 0; i < updates.length; i += 100) await base44.entities.DMA.bulkUpdate(updates.slice(i, i + 100));
  for (let i = 0; i < remove.length; i += 100) await base44.entities.DMA.deleteMany({ id: { $in: remove.slice(i, i + 100).map(record => record.id) } });
  return { ...result, notice: 'DMA records reconciled with Dataverse. Unmapped document fields were cleared.' };
}