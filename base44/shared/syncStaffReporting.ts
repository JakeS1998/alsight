import { staffEmailQuery } from './staffReportingIdentity.ts';
import { assignStaffManager } from './pipelineManager.ts';
const internal = ['admin', 'director', 'regional_director', 'bsm', 'finance', 'bdm'];
const normalise = email => String(email || '').trim().toLowerCase();
export async function syncStaffReporting(db, lineIds) {
  const { items: lines } = await db.StaffReportingLine.filter({ id: { $in: lineIds }, source_matched: true }, { limit: 50 });
  const emails = [...new Set(lines.flatMap(line => [line.staff_email, line.manager_email]).map(normalise).filter(Boolean))];
  if (!emails.length) return { identities: 0, linked: 0, pending: lines.length };
  const users = await db.User.filter({ role: { $in: internal }, $or: emails.map(email => ({ email: staffEmailQuery(email) })) });
  const match = email => { const matches = users.filter(person => normalise(person.email) === normalise(email)); return matches.length === 1 ? matches[0] : null; };
  let identities = 0, linked = 0, pending = 0;
  for (const line of lines) {
    const employee = match(line.staff_email);
    if (!employee || !line.staff_aad_id || lines.filter(item => normalise(item.staff_email) === normalise(line.staff_email)).length !== 1) { pending++; continue; }
    if (employee.staff_aad_id !== line.staff_aad_id) { await db.User.update(employee.id, { staff_aad_id: line.staff_aad_id }); employee.staff_aad_id = line.staff_aad_id; identities++; }
    const manager = line.manager_email ? match(line.manager_email) : null;
    if (!manager || manager.id === employee.id) { if (line.manager_aad_id) pending++; continue; }
    if (employee.line_manager_id !== manager.id) { await assignStaffManager(db, employee.id, manager.id); employee.line_manager_id = manager.id; linked++; }
  }
  return { identities, linked, pending };
}