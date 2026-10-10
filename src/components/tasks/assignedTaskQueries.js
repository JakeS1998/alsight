export const TASK_SOURCES = [
  { entity: 'ProjectAction', due: 'due_date', label: 'Project action', done: ['done'], title: 'action', link: r => `/projects/${r.project_id}?tab=delivery` },
  { entity: 'CRMTask', due: 'due_date', label: 'Opportunity task', done: ['completed', 'cancelled'], title: 'title', link: r => `/opportunities/${r.opportunity_id}` },
  { entity: 'CRMContactTask', due: 'due_at', label: 'Contact task', done: ['done'], title: 'title', link: r => `/crm/contacts/${r.contact_id}` },
];
export function assignedTaskQuery(source, user, contacts, horizon) {
  const ids = [...new Set([user.id, user.staff_aad_id, user.data?.staff_aad_id, ...contacts.map(c => c.aad_id)].filter(Boolean))];
  const names = [...new Set([user.full_name, ...contacts.map(c => c.full_name)].filter(Boolean))];
  const owner = source.entity === 'ProjectAction' ? { $or: [
    { owner_id: { $in: ids } },
    { $and: [{ $or: [{ owner_id: { $exists: false } }, { owner_id: '' }, { owner_id: null }] }, { owner: { $in: names } }] },
  ] } : { owner_id: user.id };
  return { $and: [owner, { status: { $nin: source.done } }, ...(horizon ? [{ [source.due]: { $exists: true, $nin: ['', null], $lte: horizon } }] : [])] };
}
export function taskRow(source, record) {
  return { ...record, taskEntity: source.entity, key: `${source.entity}-${record.id}`, title: record[source.title], due: record[source.due], source: source.label, to: source.link(record) };
}