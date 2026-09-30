import { handoverRegisters, validateHandoverRegister } from './handoverRegisters.ts';
export async function readHandoverRegister(base44, item, appId) {
  if (!item?.register_file_uri) return { summary: {}, rows: [] };
  if (!item.register_file_uri.startsWith(`mp/private/${appId}/`) || !/\.json$/i.test(item.register_file_uri)) throw new Error('Register archive is not stored in this app.');
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: item.register_file_uri, expires_in: 300 });
  const response = await fetch(signed_url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('Unable to read the saved register.');
  const reader = response.body.getReader(), chunks = []; let size = 0;
  while (true) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > 400000) { await reader.cancel(); throw new Error('Register archive is too large.'); } chunks.push(value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return validateHandoverRegister(item.key, JSON.parse(new TextDecoder().decode(bytes)));
}
export async function saveHandoverRegister(base44, item, input, actor, now) {
  const data = validateHandoverRegister(item.key, input);
  const file = new File([JSON.stringify(data)], `handover-${item.key}.json`, { type: 'application/json' });
  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
  Object.assign(item, { register_file_uri: file_uri, register_version: (item.register_version || 0) + 1, register_count: data.rows.length, register_saved_by: actor, register_saved_at: now, review_status: 'partial' });
}
export async function hydrateHandoverRegisters(base44, pack, appId) {
  await Promise.all(pack.items.filter(item => item.key !== 'warranties' && item.register_file_uri && handoverRegisters[item.key]).map(async item => { item.registerData = await readHandoverRegister(base44, item, appId); }));
  return pack;
}