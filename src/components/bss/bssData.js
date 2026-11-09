import { base44 } from '@/api/base44Client';
import { bssRegisters } from '@/components/bss/bssConfig';
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const page = { limit: 150 };
const unique = values => [...new Set(values.filter(Boolean))];
const lookup = async (entity, ids) => ids.length ? (await base44.entities[entity].filter({ $or: [{ id: { $in: ids } }, { dataverse_id: { $in: ids } }] }, page)).items : [];
const mapRecords = records => Object.fromEntries(records.flatMap(record => [record.id, record.dataverse_id].filter(Boolean).map(id => [id, record])));
export async function bssFilter(tab, search, view, status) {
  const clauses = [{ status }];
  if (search) {
    const regex = { $regex: escape(search), $options: 'i' };
    const matches = bssRegisters[tab].search.map(field => ({ [field]: regex }));
    if (tab !== 'projects') {
      const projects = await base44.entities.Project.filter({ $or: [{ name: regex }, { project_number: regex }] }, { limit: 100 });
      const ids = unique(projects.items.flatMap(record => [record.id, record.dataverse_id]));
      if (ids.length) matches.push({ project_id: { $in: ids } });
    }
    clauses.push({ $or: matches });
  }
  if (tab === 'projects') {
    if (view === 'uklf') clauses.push({ procurement_route: true });
    if (view === 'live') clauses.push({ live_project: true });
  } else {
    const done = { $or: [{ executed: 'yes' }, { date_of_execution: { $exists: true, $nin: [null, ''] } }] };
    const outstanding = { date_of_execution: { $in: [null, ''] }, ...(tab === 'warranties' ? {} : { executed: { $ne: 'yes' } }) };
    if (view === 'executed') clauses.push(tab === 'warranties' ? { date_of_execution: { $exists: true, $nin: [null, ''] } } : done);
    if (view === 'outstanding') clauses.push(outstanding);
    if (view === 'due') clauses.push(outstanding, { [tab === 'warranties' ? 'warranty_due' : 'drafting_due_date']: { $gt: '', $lt: new Date().toISOString().slice(0, 10) } });
  }
  return { $and: clauses };
}
export async function bssPage(tab, query, cursor, sort) {
  const result = await base44.entities[bssRegisters[tab].entity].filter(query, { limit: 50, sort, ...(cursor ? { cursor } : {}) });
  const projects = tab === 'projects' ? result.items : await lookup('Project', unique(result.items.map(record => record.project_id)));
  const accounts = await lookup('Account', unique([...result.items, ...projects].flatMap(record => [record.account_id, record.client_account_id, record.supplier_id, record.contractor_id])));
  const projectMap = mapRecords(projects), accountMap = mapRecords(accounts);
  return { ...result, items: result.items.map(record => ({ record, project: tab === 'projects' ? record : projectMap[record.project_id], party: accountMap[record.supplier_id] || accountMap[record.contractor_id] || accountMap[record.account_id], client: accountMap[record.client_account_id] || accountMap[projectMap[record.project_id]?.client_account_id] })) };
}