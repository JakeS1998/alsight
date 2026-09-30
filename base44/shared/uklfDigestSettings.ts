export const DIGEST_KEY = 'monthly-uklf';
export async function readDigestSettings(db) {
  const { items } = await db.UKLFDigestSettings.filter({ key: DIGEST_KEY }, { limit: 1 });
  return items[0] || { key: DIGEST_KEY, enabled: false, selected_user_ids: [] };
}
export async function digestRecipients(db, selectedIds) {
  const recipients = new Map();
  for (let skip = 0; ; skip += 100) {
    const page = await db.User.filter({ role: 'framework_stakeholder' }, 'id', 100, skip);
    for (const person of page) if (person.email) recipients.set(person.id, { id: person.id, email: person.email });
    if (recipients.size > 1000) throw new Error('The monthly digest supports up to 1,000 recipients.');
    if (page.length < 100) break;
  }
  if (selectedIds.length) {
    const selected = await db.User.filter({ id: { $in: selectedIds } });
    for (const person of selected) if (person.email) recipients.set(person.id, { id: person.id, email: person.email });
  }
  if (recipients.size > 1000) throw new Error('The monthly digest supports up to 1,000 recipients.');
  return [...recipients.values()];
}