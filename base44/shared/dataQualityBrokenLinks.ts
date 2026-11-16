import {correctedDocumentLinks} from './documentLinkCorrections.ts';
const sources = {
 jct: { entity: 'JCTFeeExtraction', recordEntity: 'JCT', idField: 'contract_id', linkField: 'linked_url', label: 'JCT' },
 dma: { entity: 'DMAFeeExtraction', recordEntity: 'DMA', idField: 'dma_id', linkField: 'source_url', label: 'DMA' },
 appointment: { entity: 'AppointmentFeeExtraction', recordEntity: 'LegalDocument', idField: 'appointment_id', linkField: 'appointment_link', label: 'Supplier appointment' }
};
const query = { status: { $in: ['unusable', 'error'] }, note: { $regex: '(?i)(saved.*(?:link|folders).*(?:could not|cannot)|no saved document link|resource could not be found|access denied|(?:link|file|document|folder).*(?:inaccessible|not found|not accessible)|\\b(?:403|404|forbidden)\\b)' } };
function safeLink(value) { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; } catch { return null; } }
export async function qualityBrokenLinks(db, input) {
 const source = sources[input.source || 'jct'];
 const counts = await Promise.all(Object.entries(sources).map(async ([key, config]) => ({ key, label: config.label, count: await db[config.entity].count(query) })));
 const page = await db[source.entity].filter(query, { sort: source.idField, limit: 25, ...(input.cursor ? { cursor: input.cursor } : {}) });
 const ids = [...new Set(page.items.map(row => row[source.idField]).filter(Boolean))];
 const records = ids.length ? await db[source.recordEntity].filter({ id: { $in: ids } }, { limit: 25, fields: ['document_id', 'project_id', 'link_to_file', 'status', 'dataverse_id', 'updated_date'] }) : { items: [] };
 const corrected = await correctedDocumentLinks(db, source.recordEntity, records.items);
 const recordMap = new Map(corrected.map(row => [row.id, row]));
 const refs = [...new Set(records.items.map(row => row.project_id).filter(Boolean))];
 const projects = refs.length ? await db.Project.filter({ $or: [{ id: { $in: refs } }, { dataverse_id: { $in: refs } }] }, { limit: 50, fields: ['name', 'dataverse_id'] }) : { items: [] };
 const projectMap = new Map(projects.items.flatMap(row => [[row.id, row], [row.dataverse_id, row]]));
 return { counts, total: counts.find(row => row.key === (input.source || 'jct')).count, next_cursor: page.next_cursor, has_more: page.has_more, items: page.items.map(row => {
  const record = recordMap.get(row[source.idField]), project = projectMap.get(record?.project_id);
  const savedLink = row[source.linkField] || '', currentLink = record?.link_to_file || '';
  const changed = !!record && (!!record.local_link || source.linkField !== 'source_url' && currentLink !== savedLink);
  return { id: row.id, recordId: record?.id, version: record?.updated_date, linkVersion: record?.link_version || '', inactive: record?.status === 'inactive', dataverse: !!record?.dataverse_id, localLink: !!record?.local_link, label: record?.document_id || row[source.idField] || 'Unlinked document', project: project?.name || '', href: project ? `/projects/${project.id}?tab=drafting` : '/documents', url: safeLink(record ? currentLink : savedLink), reason: row.note, checkedAt: row.extracted_at, category: changed ? 'Needs recheck' : !savedLink ? 'Missing link' : 'Broken or inaccessible link', changed };
 }) };
}