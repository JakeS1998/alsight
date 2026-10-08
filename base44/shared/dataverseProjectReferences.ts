import { isGuid } from './dataverseFlowFields.ts';
export const projectDocumentTables = { documents: 'LegalDocument', dma: 'DMA', jct: 'JCT', warranties: 'Warranty' };
export function projectAccessValues(table, project) {
  const values = { client_account_id: project.client_account_id || '', bdm_aad_id: project.bdm_aad_id || '' };
  if (table === 'jct' || table === 'warranties') values.project_bsm_aad_id = project.bsm_aad_id || '';
  return values;
}
export async function resolveFlowProjectReferences(base44, table, values) {
  if (table === 'projects') {
    const ids = [...new Set(values.map(v => v?.client_account_id).filter(isGuid))];
    const accounts = ids.length ? await base44.entities.Account.filter({ dataverse_id: { $in: ids } }, { limit: 100, fields: ['dataverse_id', 'name'] }) : { items: [] };
    return values.map(value => {
      if (!value) return value;
      const account = accounts.items.find(a => a.dataverse_id?.toLowerCase() === value.client_account_id?.toLowerCase());
      return { ...value, ...(account ? { client_name: account.name } : {}) };
    });
  }
  if (!projectDocumentTables[table]) return values;
  const ids = [...new Set(values.map(v => v?.project_id).filter(isGuid))];
  const projects = ids.length ? await base44.entities.Project.filter({ dataverse_id: { $in: ids } }, { limit: 100, fields: ['dataverse_id', 'client_account_id', 'bdm_aad_id', 'bsm_aad_id'] }) : { items: [] };
  return values.map(value => {
    if (!value) return value;
    const matches = projects.items.filter(p => p.dataverse_id?.toLowerCase() === value.project_id?.toLowerCase());
    if (matches.length > 1) throw new Error('Multiple projects share a Dataverse GUID. Resolve the duplicate before linking documents.');
    return matches.length ? { ...value, ...projectAccessValues(table, matches[0]) } : value;
  });
}
export async function propagateFlowProjectAccess(base44, updates) {
  const ids = [...new Set(updates.map(v => v.dataverse_id).filter(isGuid))];
  if (!ids.length) return;
  const projects = await base44.entities.Project.filter({ dataverse_id: { $in: ids } }, { limit: 100, fields: ['dataverse_id', 'client_account_id', 'bdm_aad_id', 'bsm_aad_id'] });
  for (const [table, entity] of Object.entries(projectDocumentTables)) {
    let cursor;
    do {
      const page = await base44.entities[entity].filter({ project_id: { $in: ids } }, { limit: 100, ...(cursor ? { cursor } : {}), fields: ['project_id', 'client_account_id', 'bdm_aad_id', 'project_bsm_aad_id'] });
      const changes = page.items.flatMap(record => {
        const project = projects.items.find(p => p.dataverse_id === record.project_id);
        if (!project) return [];
        const access = projectAccessValues(table, project);
        return Object.entries(access).some(([key, value]) => (record[key] || '') !== value) ? [{ id: record.id, ...access }] : [];
      });
      if (changes.length) await base44.entities[entity].bulkUpdate(changes);
      cursor = page.has_more ? page.next_cursor : null;
    } while (cursor);
  }
}