import { base44 } from '@/api/base44Client';
import { SEARCH_SOURCES, escapeSearch } from '@/components/search/searchSources';
import searchSource from '@/components/search/searchSource';

const stops = /^(what|which|where|who|how|is|are|was|were|can|could|you|please|tell|me|my|the|a|an|about|of|for|on|in|to|with|and|show|find|search|summarise|summarize|summary|status|project|projects|client|clients|contact|contacts|record|records|set|add|create|log|new|risk|risks|opportunity|opportunities|document|documents|invoice|invoices|contract|contracts|valuation|valuations|owner|due|date|pin|hide|unpin|move|restore|reset)$/i;
export function aliceRecordTerm(value) {
  const words = value.replace(/[?!,;:]+$/g, '').split(/\s+/);
  let start = words.length - 1;
  while (start >= 0 && !stops.test(words[start])) start--;
  return words.slice(Math.max(start + 1, words.length - 4)).join(' ').trim().slice(0, 80);
}
export function insertAliceRecord(value, term, title) {
  const index = value.toLowerCase().lastIndexOf(term.toLowerCase());
  return index < 0 ? value : value.slice(0, index) + title + value.slice(index + term.length);
}

export default async function aliceRecordSuggestions(term, text, user, mode) {
  if (mode === 'framework' || user.role === 'framework_stakeholder') {
    const { data } = await base44.functions.invoke('getStakeholderFrameworkReport', { term, stage: 'all', page: 0 });
    if (data.error) throw new Error(data.error);
    return { records: data.rows.slice(0, 4).map(row => ({ text: row.site || row.framework_ref, detail: row.framework_ref, kind: 'Framework record' })), partial: false };
  }
  const specific = /invoice/i.test(text) ? ['Invoice'] : /purchase order|\bpo\b/i.test(text) ? ['PurchaseOrder'] : /document|agreement|contract|jct/i.test(text) ? ['LegalDocument', 'JCT', 'DMA'] : /risk/i.test(text) ? ['ProjectRisk'] : /valuation/i.test(text) ? ['Valuation'] : /action|task/i.test(text) ? ['ProjectAction'] : null;
  const entities = specific ? ['Project', ...specific] : ['Project', 'Account', 'Contact', 'Opportunity'];
  const sources = SEARCH_SOURCES.filter(source => entities.includes(source.entity) && source.roles.includes(user.role));
  const projects = new Map();
  const results = await Promise.allSettled(sources.map(source => searchSource(source, escapeSearch(term), user.role, undefined, projects, 3)));
  return { records: results.flatMap(result => result.status === 'fulfilled' ? result.value.items.map(item => ({ text: item.title, detail: [result.value.label, item.detail].filter(Boolean).join(' · '), kind: 'Record' })) : []).slice(0, 5), partial: results.some(result => result.status === 'rejected') };
}