export const staffEmailQuery = email => ({ $regex: `^${String(email || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' });
export async function resolveStaffReportingLine(db, staffId) {
  const direct = await db.StaffReportingLine.filter({ source_matched: true, staff_aad_id: staffId }, { limit: 2 });
  if (direct.items.length === 1) return direct.items[0];
  if (direct.items.length > 1) return null;
  const [users, contacts] = await Promise.all([
    db.User.filter({ $or: [{ id: staffId }, { staff_aad_id: staffId }] }),
    db.Contact.filter({ aad_id: staffId }, { limit: 2, fields: ['email'] }),
  ]);
  const emails = [...new Set([...users, ...contacts.items].map(person => person.email?.trim().toLowerCase()).filter(Boolean))];
  if (!emails.length) return null;
  const matched = await db.StaffReportingLine.filter({ source_matched: true, $or: emails.map(email => ({ staff_email: staffEmailQuery(email) })) }, { limit: 2 });
  return matched.items.length === 1 ? matched.items[0] : null;
}