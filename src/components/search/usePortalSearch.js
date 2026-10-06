import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { SEARCH_SOURCES, escapeSearch } from '@/components/search/searchSources';
import searchSource from '@/components/search/searchSource';

export default function usePortalSearch(term, role, viewerId) {
  const [state, setState] = useState({ groups: [], loading: false, error: '' });
  const revision = useRef(0);
  const cache = useRef(new Map());
  useEffect(() => {
    revision.current += 1;
    const value = term.trim().slice(0, 80);
    if (value.length < 2) { setState({ groups: [], loading: false, error: '' }); return; }
    const key = JSON.stringify([viewerId, role, value.toLowerCase()]);
    const cached = cache.current.get(key);
    if (cached && cached.expires > Date.now()) { setState({ groups: cached.groups, loading: false, error: '' }); return; }
    let active = true;
    setState({ groups: [], loading: true, error: '' });
    const timer = setTimeout(async () => {
      const sources = SEARCH_SOURCES.filter(source => source.roles.includes(role));
      const projects = new Map();
      const tasks = sources.map(source => () => searchSource(source, escapeSearch(value), role, undefined, projects));
      if (role === 'framework_stakeholder') tasks.push(() => base44.functions.invoke('getStakeholderFrameworkReport', { term: value, stage: 'all', page: 0 }).then(({ data }) => ({ label: 'Framework360', more: data.count > data.rows.length, cursor: data.rows.length ? 1 : null, items: data.rows.map(r => ({ id: r.id, title: r.site || r.framework_ref, detail: r.framework_ref, path: `/framework-reports/${r.id}` })) })));
      const results = new Array(tasks.length);
      let next = 0, failed = false;
      const worker = async () => {
        while (active && next < tasks.length) {
          const index = next++;
          try { results[index] = await tasks[index](); }
          catch { failed = true; }
          if (!active) return;
          setState(previous => ({ ...previous, groups: results.filter(group => group?.items.length).map(group => previous.groups.find(existing => existing.label === group.label) || group), error: failed ? 'Some records could not be searched.' : '' }));
        }
      };
      await Promise.all(Array.from({ length: Math.min(4, tasks.length) }, worker));
      if (!active) return;
      setState(previous => ({ ...previous, loading: false }));
      if (!failed) {
        if (cache.current.size >= 20) cache.current.delete(cache.current.keys().next().value);
        cache.current.set(key, { groups: results.filter(group => group?.items.length), expires: Date.now() + 30000 });
      }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [term, role, viewerId]);
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