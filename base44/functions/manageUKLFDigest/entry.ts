import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { DIGEST_KEY, readDigestSettings } from '../../shared/uklfDigestSettings.ts';
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Administrator access required.' }, { status: 403 });
    const body = await req.json();
    const db = base44.entities;
    if (body.action === 'get') {
      const offset = body.offset ?? 0;
      if (!Number.isInteger(offset) || offset < 0 || offset > 10000) return Response.json({ error: 'Invalid user page.' }, { status: 400 });
      const [settings, users] = await Promise.all([readDigestSettings(db), db.User.filter({ role: { $ne: 'framework_stakeholder' } }, 'full_name', 51, offset)]);
      return Response.json({ settings, users: users.slice(0, 50).map(person => ({ id: person.id, full_name: person.full_name, email: person.email })), hasMore: users.length > 50 });
    }
    if (body.action !== 'save' || typeof body.enabled !== 'boolean' || !Array.isArray(body.selectedUserIds) || body.selectedUserIds.length > 50 || body.selectedUserIds.some(id => typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(id))) return Response.json({ error: 'Choose up to 50 registered portal users.' }, { status: 400 });
    const ids = [...new Set(body.selectedUserIds)];
    const selected = ids.length ? await db.User.filter({ id: { $in: ids } }) : [];
    if (selected.length !== ids.length || selected.some(person => !person.email)) return Response.json({ error: 'Each selected recipient must have a registered portal account and email.' }, { status: 400 });
    const result = await db.UKLFDigestSettings.upsert([{ key: DIGEST_KEY, enabled: body.enabled, selected_user_ids: ids }], { key: 'key' });
    return Response.json({ settings: result.records[0] });
  } catch (error) {
    console.error('UKLF digest settings unavailable', error);
    return Response.json({ error: 'Unable to update monthly digest settings.' }, { status: 500 });
  }
}