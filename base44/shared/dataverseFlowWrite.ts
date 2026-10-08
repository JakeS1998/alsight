import { flowSpecs, isGuid, validateFlowValue } from './dataverseFlowFields.ts';
import { personalDataverseContext, getPersonalDataverseToken } from './dataverseUserAuth.ts';
import { flowRequest } from './dataverseFlowApi.ts';
export async function writeFlowContext(base44, user, config, input) {
  const spec = flowSpecs[input.table], settings = config?.tables?.[input.table];
  if (!settings?.mappings?.length) throw new Error('An administrator must confirm this table’s mapping first.');
  if (!spec.writeRoles.includes(user.role)) { const error = new Error('Your ALSight role cannot edit this table.'); error.status = 403; throw error; }
  if (typeof input.recordId !== 'string' || input.recordId.length > 100) throw new Error('Choose an ALSight record.');
  // User-scoped reads enforce the existing ALSight record visibility rules before any Dataverse operation.
  const record = await base44.entities[spec.entity].get(input.recordId);
  if (!record || !isGuid(record.dataverse_id)) throw new Error('This ALSight record is not linked to Dataverse.');
  const { environment, record: connection } = await personalDataverseContext(base44, user);
  if (environment !== config.environment_url) throw new Error('The environment changed. Ask an administrator to review the mappings.');
  const token = await getPersonalDataverseToken(base44, user, environment, connection);
  return { spec, settings, record, environment, token };
}
export async function loadFlowRecord(context) {
  const { settings, environment, token, record } = context;
  const select = [...new Set([settings.primaryId, ...settings.mappings.map(m => m.source)])].join(',');
  const data = await flowRequest(environment, token, `${settings.entitySet}(${record.dataverse_id})?$select=${select}`);
  const etag = data['@odata.etag'];
  if (typeof etag !== 'string' || !/^W\/"[0-9]+"$/.test(etag)) throw new Error('Dataverse did not return a version for safe editing.');
  const values = Object.fromEntries(settings.mappings.map(m => [m.local, data[m.source] ?? null]));
  return { values, etag, fields: settings.mappings, recordId: record.id, title: record[context.spec.required] };
}
export async function saveFlowRecord(base44, context, input) {
  if (typeof input.etag !== 'string' || !/^W\/"[0-9]+"$/.test(input.etag)) throw new Error('Reload this record before saving.');
  if (!input.values || typeof input.values !== 'object' || Array.isArray(input.values)) throw new Error('Invalid changes.');
  const entries = Object.entries(input.values);
  if (!entries.length || entries.length > 25) throw new Error('Choose between one and 25 fields to update.');
  const payload = {};
  for (const [local, value] of entries) {
    const mapping = context.settings.mappings.find(m => m.local === local && m.write);
    if (!mapping) throw new Error('This field is not enabled for write-back.');
    const validated = validateFlowValue(mapping.localType, value, local === context.spec.required);
    if (['Integer', 'BigInt'].includes(mapping.type) && validated !== null && !Number.isInteger(validated)) throw new Error('This Dataverse field requires a whole number.');
    if (/^email[23]?$/.test(local) && validated && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(validated)) throw new Error('Enter a valid email address.');
    payload[mapping.source] = validated === '' ? null : validated;
  }
  await flowRequest(context.environment, context.token, `${context.settings.entitySet}(${context.record.dataverse_id})`, { method: 'PATCH', headers: { 'If-Match': input.etag }, body: JSON.stringify(payload) });
  const fresh = await loadFlowRecord(context);
  const localValues = Object.fromEntries(context.settings.mappings.map(m => [m.local, validateFlowValue(m.localType, fresh.values[m.local], m.local === context.spec.required)]));
  try { await base44.entities[context.spec.entity].update(context.record.id, localValues); }
  catch { return { ...fresh, notice: 'Saved in Dataverse under your account. The ALSight copy could not refresh; ask an administrator to synchronise this table.' }; }
  return { ...fresh, notice: 'Saved in Dataverse under your connected account and refreshed in ALSight.' };
}