import { base44 } from '@/api/base44Client';
export async function scopedClientQuery(user, search = '') {
  const groups = await base44.entities.Opportunity.aggregate({ groupBy: 'account_id', limit: 1000 });
  if (groups.truncated) throw new Error('Too many linked clients to display at once. Please contact an administrator.');
  const ids = groups.rows.map(row => row.account_id).filter(Boolean);
  const visible = [{ created_by_id: user.id }];
  if (ids.length) visible.push({ id: { $in: ids } });
  return { account_type: 'client', $or: visible, ...(search.trim() ? { name: { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } } : {}) };
}