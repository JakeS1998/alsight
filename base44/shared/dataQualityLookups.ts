import { withPortalUserNames } from './portalUserNames.ts';
const escapePattern = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export async function qualityLookup(db, input) {
  if (!['bdm','bsm','client','jct'].includes(input.lookup) || typeof input.search !== 'string' || input.search.length > 100 || (input.value != null && (typeof input.value !== 'string' || input.value.length > 100))) throw new Error('Choose a valid lookup and search term.');
  const regex = { $regex: escapePattern(input.search.trim()), $options: 'i' };
  if (input.lookup === 'bdm' || input.lookup === 'bsm') {
    const query = { role: input.lookup, ...(input.search.trim() ? { full_name: regex } : {}) };
    const users = await db.User.filter(query, 'full_name', 50);
    const current = input.value ? await db.User.filter({ role: input.lookup, $or: [{ id: input.value }, { staff_aad_id: input.value }] }, 'full_name', 1) : [];
    const named = await withPortalUserNames(db, [...current, ...users.filter(row => !current.some(old => old.id === row.id))]);
    return { options: named.map(row => ({ value: row.staff_aad_id || row.id, label: row.full_name || row.email })) };
  }
  const entity = input.lookup === 'client' ? db.Account : db.JCT, label = input.lookup === 'client' ? 'name' : 'document_id';
  const base = { status: { $ne: 'inactive' }, ...(input.lookup === 'client' ? { account_type: 'client' } : {}) };
  const page = await entity.filter({ ...base, ...(input.search.trim() ? { [label]: regex } : {}) }, { sort: label, limit: 30, fields: [label, 'dataverse_id'] });
  const selected = input.value ? await entity.filter({ ...base, $or: [{ id: input.value },{ dataverse_id: input.value }] }, { limit: 1, fields: [label,'dataverse_id'] }) : { items: [] };
  return { options: [...selected.items, ...page.items.filter(row => !selected.items.some(old => old.id === row.id))].map(row => ({ value: input.lookup === 'client' ? row.dataverse_id || row.id : row.id, label: row[label] || row.id })) };
}