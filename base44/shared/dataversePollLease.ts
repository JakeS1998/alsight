export async function withDataversePollLease(base44, work) {
  const db = base44.entities.DataversePollState;
  const { records } = await db.upsert([{ key: 'primary' }], { key: 'key' });
  const state = records[0], token = crypto.randomUUID(), now = new Date().toISOString();
  const claimed = await db.updateMany({ id: state.id, lease_until: { $lt: now } }, { $set: { lease_token: token, lease_until: new Date(Date.now() + 360000).toISOString() } });
  if (!claimed.updated) return { continue: false, skipped: 'Another sync batch is already running.' };
  try { return await work(await db.get(state.id)); }
  finally { await db.updateMany({ id: state.id, lease_token: token }, { $set: { lease_until: '1970-01-01T00:00:00.000Z', lease_token: '' } }); }
}