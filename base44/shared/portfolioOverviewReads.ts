import { scopedReadCache } from './scopedReadCache.ts';

export function portfolioCachedRead(user, input) {
  const scope = JSON.stringify([user.id, user.role, user.data, user.account_id, user.region, user.delegate_of, user.staff_aad_id, [...input.projectIds].sort(), input.since || null,typeof input.valueVersion==='string' ? input.valueVersion.slice(0,100) : null]);
  return (key, load) => scopedReadCache(`portfolio:${scope}:${key}`, load);
}

export function projectOverviewRollups(result) {
  if (result.truncated) throw new Error('Portfolio project summary exceeded its grouping limit.');
  const projects = new Map();
  const regions = new Map();
  for (const row of result.rows) {
    for (const [map, field] of [[projects, 'live_project'], [regions, 'department_id']]) {
      const key = row[field] ?? null;
      const total = map.get(key) || { [field]: key, count: 0, sum_estimated_value: 0 };
      total.count += row.count;
      total.sum_estimated_value += row.sum_estimated_value || 0;
      map.set(key, total);
    }
  }
  return { projects: [...projects.values()], regions: [...regions.values()].sort((a, b) => b.sum_estimated_value - a.sum_estimated_value) };
}