import { flowSpecs, isGuid, validateFlowValue } from './dataverseFlowFields.ts';
import { personalDataverseContext, getPersonalDataverseToken } from './dataverseUserAuth.ts';
import { flowRequest } from './dataverseFlowApi.ts';
import { flowSelection, mappedFlowValues } from './dataverseFlowValues.ts';
import { addFlowWriteValue } from './dataverseWritePayload.ts';
export async function writeFlowContext(base44, user, config, input) {
  const spec = flowSpecs[input.table], settings = config?.tables?.[input.table];
  if (!settings?.mappings?.length) throw new Error('An administrator must confirm this table’s mapping first.');
  if (!spec.writeRoles.includes(user.role)) { const error = new Error('Your ALSight role cannot edit this table.'); error.status = 403; throw error; }
  if (typeof input.recordId !== 'string' || input.recordId.length > 100) throw new Error('Choose an ALSight record.');
  // User-scoped reads enforce the existing ALSight record visibility rules before any Dataverse operation.
  const record = await base44.entities[spec.entity].get(input.recordId);
  const sourceId = record?.[spec.identityField || 'dataverse_id'];
  if (!record || !isGuid(sourceId)) throw new Error('This ALSight record is not linked to Dataverse.');
  const { environment, record: connection } = await personalDataverseContext(base44, user);
  if (environment !== config.environment_url) throw new Error('The environment changed. Ask an administrator to review the mappings.');
  const token = await getPersonalDataverseToken(base44, user, environment, connection);
  return { spec, settings, record, sourceId, environment, token };
}
export async function loadFlowRecord(context) {
  const { settings, environment, token, record } = context;
  const select = flowSelection(settings, context.spec.entity === 'User' ? 'users' : Object.keys(flowSpecs).find(key => flowSpecs[key].entity === context.spec.entity));
  const data = await flowRequest(environment, token, `${settings.entitySet}(${context.sourceId})?$select=${select}`);
  const etag = data['@odata.etag'];
  if (typeof etag !== 'string' || !/^W\/"[0-9]+"$/.test(etag)) throw new Error('Dataverse did not return a version for safe editing.');
  const values = mappedFlowValues(Object.keys(flowSpecs).find(key => flowSpecs[key].entity === context.spec.entity), settings, data);
  const choiceValues = Object.fromEntries(settings.mappings.filter(m => m.write && ['Picklist', 'State', 'Status'].includes(m.type)).map(m => [m.local, data[m.queryName || m.source] ?? null]));
  return { values, choiceValues, etag, fields: settings.mappings, recordId: record.id, title: record[context.spec.labelField || context.spec.required] };
}
export async function saveFlowRecord(base44, context, input) {
  if (typeof input.etag !== 'string' || !/^W\/"[0-9]+"$/.test(input.etag)) throw new Error('Reload this record before saving.');
  if (!input.values || typeof input.values !== 'object' || Array.isArray(input.values)) throw new Error('Invalid changes.');
  const entries = Object.entries(input.values);
  if (!entries.length || entries.length > 100) throw new Error('Choose between one and 100 mapped fields to update.');
  const payload = {};
  for (const [local, value] of entries) {
    const mapping = context.settings.mappings.find(m => m.local === local && m.write);
    if (!mapping) throw new Error('This field is not enabled for write-back.');
    await addFlowWriteValue(context, mapping, value, payload);
  }
  await flowRequest(context.environment, context.token, `${context.settings.entitySet}(${context.sourceId})`, { method: 'PATCH', headers: { 'If-Match': input.etag }, body: JSON.stringify(payload) });
  let fresh;
  try { fresh = await loadFlowRecord(context); }
  catch { return { refreshRequired: true, notice: 'Saved in Dataverse under your account, but the updated values could not be reloaded. Reload before making more changes.' }; }
  const localValues = Object.fromEntries(context.settings.mappings.map(m => [m.local, validateFlowValue(m.localType, fresh.values[m.local], m.local === context.spec.required)]));
  try { await base44.entities[context.spec.entity].update(context.record.id, localValues); }
  catch { return { ...fresh, notice: 'Saved in Dataverse under your account. The ALSight copy could not refresh; ask an administrator to synchronise this table.' }; }
  return { ...fresh, notice: 'Saved in Dataverse under your connected account and refreshed in ALSight.' };
}