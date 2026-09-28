import { base44 } from '@/api/base44Client';

export async function createContactAction(data, user, contact) {
  const task = await base44.entities.CRMContactTask.create(data);
  if (!data.due_at) return { task };
  try {
    await base44.entities.CRMReminder.create({ user_id: user.id, contact_id: contact.id, activity_id: task.id, subject: `${contact.full_name}: ${data.title}`, remind_at: data.due_at });
    return { task };
  } catch (error) {
    return { task, warning: `Action saved, but reminder failed: ${error.message}` };
  }
}

export async function completeContactAction(task, user) {
  await base44.entities.CRMContactTask.update(task.id, { status: 'done' });
  const page = await base44.entities.CRMReminder.filter({ activity_id: task.id, user_id: user.id, dismissed_at: { $exists: false } }, { limit: 1 });
  if (page.items[0]) await base44.entities.CRMReminder.update(page.items[0].id, { dismissed_at: new Date().toISOString() });
}