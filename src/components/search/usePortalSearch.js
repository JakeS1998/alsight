import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { SEARCH_SOURCES, escapeSearch } from '@/components/search/searchSources';
import { CLIENT_HIDDEN_DOC_TYPES } from '@/lib/portal';

async function resolveProjects(source, rows, role) {
  if (!source.projectKey || role === 'project_manager') return rows.map(record => ({ record, project: { id: record.project_id } }));
  const refs = [...new Set(rows.map(r => r[source.projectKey]).filter(Boolean))];
  if (!refs.length) return [];
  const key = source.projectFormat === 'dataverse' ? 'dataverse_id' : 'id';
  const pages = await Promise.all(Array.from({ length: Math.ceil(refs.length / 40) }, (_, i) =>
    base44.entities.Project.filter({ [key]: { $in: refs.slice(i * 40, (i + 1) * 40) }, status: { $ne: 'inactive' } }, { limit: 40, fields: ['id', 'dataverse_id', 'name'] })));
  const byRef = new Map(pages.flatMap(page => page.items).map(p => [p[key], p]));
  return rows.map(record => ({ record, project: byRef.get(record[source.projectKey]) })).filter(item => item.project);
}

async function searchSource(source, regex, role, cursor) {
  const query = { $or: source.fields.map(field => ({ [field]: { $regex: regex, $options: 'i' } })),
    ...(source.entity === 'LegalDocument' && role === 'client' ? { document_type: { $nin: CLIENT_HIDDEN_DOC_TYPES } } : {}) };
  const page = await base44.entities[source.entity].filter(query, { limit: 12, ...(cursor ? { cursor } : {}), fields: [...new Set([...source.fields, ...(source.extra || []), ...(source.projectKey ? [source.projectKey] : [])])] });
  const linked = await resolveProjects(source, page.items, role);
  return { label: source.label, items: linked.map(({ record, project }) => ({
    id: record.id, title: source.title(record), detail: source.detail?.(record) || project?.name || '',
    path: source.path ? source.path(record) : `/projects/${project.id}?tab=${role === 'supplier' ? 'timeline' : source.tab}`,
  })).filter(item => item.title && item.path), more: page.has_more, cursor: page.next_cursor };
}

export default function usePortalSearch(term, role) {
  const [state, setState] = useState({ groups: [], loading: false, error: '' });
  const revision = useRef(0);
  useEffect(() => {
    revision.current += 1;
    const value = term.trim().slice(0, 80);
    if (value.length < 2) { setState({ groups: [], loading: false, error: '' }); return; }
    let active = true;
    setState({ groups: [], loading: true, error: '' });
    const timer = setTimeout(async () => {
      const sources = SEARCH_SOURCES.filter(source => source.roles.includes(role));
      const results = await Promise.allSettled([
        ...sources.map(source => searchSource(source, escapeSearch(value), role)),
        ...(role === 'framework_stakeholder' ? [base44.functions.invoke('getStakeholderFrameworkReport', { term: value, stage: 'all', page: 0 }).then(({ data }) => ({ label: 'Framework reports', more: data.count > data.rows.length, cursor: data.rows.length ? 1 : null, items: data.rows.map(r => ({ id: r.id, title: r.site || r.framework_ref, detail: r.framework_ref, path: `/framework-reports/${r.id}` })) }))] : []),
      ]);
      if (!active) return;
      const groups = results.filter(result => result.status === 'fulfilled').map(result => result.value).filter(group => group.items.length);
      setState({ groups, loading: false, error: results.some(result => result.status === 'rejected') ? 'Some records could not be searched.' : '' });
    }, 450);
    return () => { active = false; clearTimeout(timer); };
  }, [term, role]);
  const loadMore = async (group) => {
    if (!group.more || group.loadingMore) return;
    const current = revision.current;
    setState(previous => ({ ...previous, groups: previous.groups.map(g => g.label === group.label ? { ...g, loadingMore: true } : g) }));
    try {
      const source = SEARCH_SOURCES.find(s => s.label === group.label);
      const next = source ? await searchSource(source, escapeSearch(term.trim().slice(0, 80)), role, group.cursor)
        : await base44.functions.invoke('getStakeholderFrameworkReport', { term: term.trim().slice(0, 80), stage: 'all', page: group.cursor }).then(({ data }) => ({ items: data.rows.map(r => ({ id: r.id, title: r.site || r.framework_ref, detail: r.framework_ref, path: `/framework-reports/${r.id}` })), more: group.cursor * 50 + data.rows.length < data.count, cursor: group.cursor + 1 }));
      if (current !== revision.current) return;
      setState(previous => ({ ...previous, groups: previous.groups.map(g => g.label === group.label ? { ...g, items: [...g.items, ...next.items], more: next.more, cursor: next.cursor, loadingMore: false } : g) }));
    } catch (error) {
      if (current === revision.current) setState(previous => ({ ...previous, error: 'Unable to load more results.', groups: previous.groups.map(g => g.label === group.label ? { ...g, loadingMore: false } : g) }));
    }
  };
  return { ...state, loadMore };
}