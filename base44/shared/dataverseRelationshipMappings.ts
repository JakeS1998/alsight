import { flowSpecs } from './dataverseFlowFields.ts';
import { inspectFlowTable } from './dataverseFlowMetadata.ts';
const relationshipColumns = {
  projects: { client_account_id: ['bss_clientaccount'], account_id: ['bss_account'], bdm_aad_id: ['bss_bdmuserlu', 'bss_bdm'], bsm_aad_id: ['bss_bsmuserlu', 'bss_bsm'], department_id: ['bss_department'] },
  documents: { project_id: ['bss_project'], account_id: ['bss_account'], bsm_aad_id: ['bss_bsmuser'] },
  dma: { project_id: ['bss_project'], bsm_aad_id: ['bss_bsmuser'] },
  jct: { project_id: ['bss_project'], project_bsm_aad_id: ['bss_projectbsm'] },
  warranties: { project_id: ['bss_project'] }
};
export function addFlowRelationships(table, settings, inspected) {
  let mappings = [...(settings.mappings || [])];
  if (table === 'projects') {
    const client = mappings.find(m => m.local === 'client_name' && m.type === 'Lookup');
    if (client && !mappings.some(m => m.local === 'client_account_id')) mappings = mappings.map(m => m === client ? { ...m, local: 'client_account_id', localType: 'Lookup', write: false } : m);
  }
  for (const [local, names] of Object.entries(relationshipColumns[table] || {})) {
    if (mappings.some(m => m.local === local)) continue;
    const field = names.map(name => inspected.fields.find(f => f.name === name && f.type === 'Lookup')).find(f => f && !mappings.some(m => m.source === f.name));
    if (field) mappings.push({ local, source: field.name, queryName: field.queryName, type: 'Lookup', localType: 'Lookup', write: false, origin: 'automatic' });
  }
  return mappings;
}
export async function configureFlowRelationships(base44, context, config) {
  const tables = { ...config.tables };
  for (const table of Object.keys(relationshipColumns)) {
    const settings = tables[table];
    if (!settings?.mappings?.length) continue;
    const inspected = await inspectFlowTable(context, table, settings.logicalName);
    const mappings = addFlowRelationships(table, settings, inspected);
    tables[table] = { ...settings, mappings, revision: crypto.randomUUID(), cursor: '', processed: 0, updated: 0, queued: 0, complete: false };
  }
  await base44.entities.DataverseFlowConfig.update(config.id, { tables });
  return { tables, notice: 'Project ownership, client access and document project GUID lookups are configured. New non-user records import automatically.' };
}