import { withPortalUserNames } from './portalUserNames.ts';
const escapePattern = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export async function qualityLookup(db, input) {
  if (!['bdm','bsm','client','jct'].includes(input.lookup) || typeof input.search !== 'string' || input.search.length > 100 || (input.value != null && (typeof input.value !== 'string' || input.value.length > 100))) throw new Error('Choose a valid lookup and search term.');
  const regex = { $regex: escapePattern(input.search.trim()), $options: 'i' };
  if (input.lookup === 'bdm' || input.lookup === 'bsm') {
    const query = { role: input.lookup, ...(input.search.trim() ? { full_name: regex } : {}) };
    const users = await db.User.filter(query, 'full_name', 50);
    const current = input.value ? await db.User.filter({ role: input.lookup, $or: [{ id: input.value }, { staff_aad_id: input.value }, { 'data.staff_aad_id': input.value }] }, 'full_name', 1) : [];
    const named = await withPortalUserNames(db, [...current, ...users.filter(row => !current.some(old => old.id === row.id))]);
    const staffQuery = { portal_role: input.lookup, status: { $ne: 'inactive' }, aad_id: { $regex: '\\S' } };
    const contacts = await db.Contact.filter({ ...staffQuery, ...(input.search.trim() ? { full_name: regex } : {}) }, { sort: 'full_name', limit: 30, fields: ['aad_id','full_name'] });
    const selected = input.value ? await db.Contact.filter({ ...staffQuery, aad_id: input.value }, { limit: 1, fields: ['aad_id','full_name'] }) : { items: [] };
    const options = new Map(named.map(row => [row.staff_aad_id || row.data?.staff_aad_id || row.id, { value: row.staff_aad_id || row.data?.staff_aad_id || row.id, label: row.full_name || row.email }]));
    for (const row of [...selected.items, ...contacts.items]) options.set(row.aad_id, { value: row.aad_id, label: row.full_name });
    return { options: [...options.values()] };
  }
  const entity = input.lookup === 'client' ? db.Account : db.JCT, label = input.lookup === 'client' ? 'name' : 'document_id';
  const base = { status: { $ne: 'inactive' }, ...(input.lookup === 'client' ? { account_type: 'client' } : {}) };
  const page = await entity.filter({ ...base, ...(input.search.trim() ? { [label]: regex } : {}) }, { sort: label, limit: 30, fields: [label, 'dataverse_id'] });
  const selected = input.value ? await entity.filter({ ...base, $or: [{ id: input.value },{ dataverse_id: input.value }] }, { limit: 1, fields: [label,'dataverse_id'] }) : { items: [] };
  return { options: [...selected.items, ...page.items.filter(row => !selected.items.some(old => old.id === row.id))].map(row => ({ value: input.lookup === 'client' ? row.dataverse_id || row.id : row.id, label: row[label] || row.id })) };
}