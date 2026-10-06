import { base44 } from '@/api/base44Client';
import { CLIENT_HIDDEN_DOC_TYPES } from '@/lib/portal';

async function resolveProjects(source, rows, role, projects) {
  if (!source.projectKey || role === 'project_manager') return rows.map(record => ({ record, project: { id: record.project_id } }));
  const refs = [...new Set(rows.map(record => record[source.projectKey]).filter(Boolean))];
  const key = source.projectFormat === 'dataverse' ? 'dataverse_id' : 'id';
  const missing = refs.filter(ref => !projects.has(`${key}:${ref}`));
  if (missing.length) {
    const request = base44.entities.Project.filter({ [key]: { $in: missing }, status: { $ne: 'inactive' } }, { limit: 40, fields: ['id', 'dataverse_id', 'name'] });
    missing.forEach(ref => projects.set(`${key}:${ref}`, request.then(page => page.items.find(project => project[key] === ref))));
  }
  const resolved = await Promise.all(refs.map(async ref => [ref, await projects.get(`${key}:${ref}`)]));
  const byRef = new Map(resolved);
  return rows.map(record => ({ record, project: byRef.get(record[source.projectKey]) })).filter(item => item.project);
}

export default async function searchSource(source, regex, role, cursor, projects = new Map()) {
  const query = { $or: source.fields.map(field => ({ [field]: { $regex: regex, $options: 'i' } })),
    ...(source.entity === 'LegalDocument' && role === 'client' ? { document_type: { $nin: CLIENT_HIDDEN_DOC_TYPES } } : {}) };
  const page = await base44.entities[source.entity].filter(query, { limit: 12, ...(cursor ? { cursor } : {}), fields: [...new Set([...source.fields, ...(source.extra || []), ...(source.projectKey ? [source.projectKey] : [])])] });
  const linked = await resolveProjects(source, page.items, role, projects);
  return { label: source.label, items: linked.map(({ record, project }) => ({
    id: record.id, title: source.title(record), detail: source.detail?.(record) || project?.name || '',
    path: source.path ? source.path(record) : `/projects/${project.id}?tab=${role === 'supplier' ? 'timeline' : source.tab}`,
  })).filter(item => item.title && item.path), more: page.has_more, cursor: page.next_cursor };
}