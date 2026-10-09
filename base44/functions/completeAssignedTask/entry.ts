import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in to complete a task.' }, { status: 401 });
    const { entity, id } = await req.json();
    const statuses = { ProjectAction: 'done', CRMTask: 'completed', CRMContactTask: 'done' };
    if (!Object.hasOwn(statuses, entity) || typeof id !== 'string' || !id.trim() || id.length > 100) return Response.json({ error: 'Select a valid assigned task.' }, { status: 400 });
    const task = await base44.entities[entity].get(id);
    if (!task) return Response.json({ error: 'Task not found.' }, { status: 404 });
    let assigned = task.owner_id === user.id;
    if (entity === 'ProjectAction') {
      const alternatives = [{ aad_id: user.id }, ...(user.email ? [{ email: user.email }] : [])];
      const { items: contacts } = await base44.entities.Contact.filter({ $or: alternatives }, { limit: 20, fields: ['full_name', 'aad_id'] });
      const ids = [user.id, user.staff_aad_id, user.data?.staff_aad_id, ...contacts.map(contact => contact.aad_id)].filter(Boolean);
      const names = [user.full_name, ...contacts.map(contact => contact.full_name)].filter(Boolean);
      assigned = task.owner_id ? ids.includes(task.owner_id) : names.includes(task.owner);
    }
    if (!assigned) return Response.json({ error: 'You can only complete tasks assigned to you.' }, { status: 403 });
    if (task.status === 'cancelled') return Response.json({ error: 'This task has been cancelled.' }, { status: 409 });
    // Elevation is limited to completing this verified, personally assigned task.
    if (task.status !== statuses[entity]) await base44.asServiceRole.entities[entity].update(id, { status: statuses[entity], ...(entity === 'CRMTask' ? { completed_at: new Date().toISOString() } : {}) });
    if (entity === 'CRMContactTask') {
      const page = await base44.entities.CRMReminder.filter({ activity_id: id, user_id: user.id, dismissed_at: { $exists: false } }, { limit: 1 });
      if (page.items[0]) await base44.entities.CRMReminder.update(page.items[0].id, { dismissed_at: new Date().toISOString() });
    }
    return Response.json({ id, entity, status: statuses[entity] });
  } catch (error) {
    return Response.json({ error: error.message || 'Could not complete the task.' }, { status: error.status || 500 });
  }
}