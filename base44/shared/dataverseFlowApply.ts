export async function applyFlowUpdates(base44, table, spec, updates, appliedReviews) {
  if (table === 'users') {
    for (let start = 0; start < updates.length; start += 4) {
      await Promise.all(updates.slice(start, start + 4).map(({ id, ...values }) => base44.entities.User.update(id, values)));
    }
  } else if (updates.length) {
    await base44.entities[spec.entity].upsert(updates.map(({ id, ...values }) => values), { key: 'dataverse_id' });
  }
  if (appliedReviews.length) await base44.entities.DataverseSyncReview.bulkUpdate(appliedReviews.map(id => ({ id, status: 'applied', error: '', applied_at: new Date().toISOString() })));
}