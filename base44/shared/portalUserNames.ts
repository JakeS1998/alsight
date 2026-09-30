import { staffEmailQuery } from './staffReportingIdentity.ts';

const emailOf = value => String(value || '').trim().toLowerCase();
const nameOf = contact => String(contact.full_name || [contact.first_name, contact.last_name].filter(Boolean).join(' ')).trim();

export async function withPortalUserNames(db, users) {
  const resolved = [];
  for (let start = 0; start < users.length; start += 50) {
    const batch = users.slice(start, start + 50);
    const ids = batch.flatMap(user => [user.id, user.staff_aad_id || user.data?.staff_aad_id]).filter(Boolean);
    const emails = [...new Set(batch.map(user => emailOf(user.email)).filter(Boolean))];
    const alternatives = [{ aad_id: { $in: ids } }, ...emails.flatMap(email => ['email', 'email2', 'email3'].map(field => ({ [field]: staffEmailQuery(email) })))];
    const contacts = [];
    let cursor;
    do {
      const page = await db.Contact.filter({ status: { $ne: 'inactive' }, $or: alternatives }, { limit: 100, fields: ['aad_id', 'email', 'email2', 'email3', 'full_name', 'first_name', 'last_name'], ...(cursor ? { cursor } : {}) });
      contacts.push(...page.items);
      cursor = page.has_more ? page.next_cursor : null;
    } while (cursor);
    for (const user of batch) {
      const linked = contacts.filter(contact => contact.aad_id === user.id || (user.staff_aad_id && contact.aad_id === user.staff_aad_id));
      const matched = linked.length ? linked : contacts.filter(contact => [contact.email, contact.email2, contact.email3].some(email => emailOf(email) && emailOf(email) === emailOf(user.email)));
      const names = [...new Set(matched.map(nameOf).filter(Boolean))];
      resolved.push({ ...user, full_name: names.length === 1 ? names[0] : user.full_name });
    }
  }
  return resolved;
}