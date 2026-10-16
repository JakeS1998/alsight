import { personalDataverseContext, getPersonalDataverseToken } from './dataverseUserAuth.ts';
import { flowRequest } from './dataverseFlowApi.ts';
import { flowSpecs, isGuid, isName } from './dataverseFlowFields.ts';
import { flowSelection, mappedFlowValues } from './dataverseFlowValues.ts';
import { addFlowWriteValue } from './dataverseWritePayload.ts';

export async function createDataverseContact(base44, user, config, input) {
  if (!flowSpecs.contacts.writeRoles.includes(user.role)) { const error = new Error('Your ALSight role cannot create contacts.'); error.status = 403; throw error; }
  if (!isGuid(input.requestId)) throw new Error('Reopen the form before adding this person.');
  const values = {};
  for (const field of ['first_name', 'last_name', 'email', 'job_title', 'company_name']) {
    const value = input.values?.[field] ?? '';
    if (typeof value !== 'string' || value.length > 160) throw new Error('Contact details must be text of up to 160 characters.');
    values[field] = value.trim();
  }
  if (!values.last_name) throw new Error('Enter the person’s last name.');
  values.email = values.email.toLowerCase();
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) throw new Error('Enter a valid work email.');
  const settings = config?.tables?.contacts;
  if (settings?.logicalName !== 'contact' || !isName(settings.entitySet) || !isName(settings.primaryId) || !settings.mappings?.length) throw new Error('Confirm the Dataverse contact table mapping first.');
  const existing = await base44.entities.Contact.filter({ dataverse_id: input.requestId }, { limit: 1 });
  if (existing.items[0]) return { person: existing.items[0] };
  if (values.email) {
    const duplicate = await base44.entities.Contact.filter({ email: values.email }, { limit: 1 });
    if (duplicate.items.length) throw new Error('A person with this email already exists. Open that person instead.');
  }
  const { environment, record } = await personalDataverseContext(base44, user);
  if (environment !== config.environment_url) throw new Error('Your Dataverse account uses a different environment.');
  const token = await getPersonalDataverseToken(base44, user, environment, record);
  const context = { environment, token, settings, spec: flowSpecs.contacts };
  const path = `${settings.entitySet}(${input.requestId})?$select=${flowSelection(settings, 'contacts')}`;
  let source;
  try { source = await flowRequest(environment, token, path); }
  catch (error) { if (error.status !== 404) throw error; }
  if (!source) {
    const metadata = await flowRequest(environment, token, "EntityDefinitions(LogicalName='contact')/Attributes?$select=LogicalName,IsValidForCreate");
    const writable = new Set((metadata.value || []).filter(field => field.IsValidForCreate).map(field => field.LogicalName));
    const payload = { [settings.primaryId]: input.requestId };
    for (const [field, value] of Object.entries(values)) {
      if (!value) continue;
      const mapping = settings.mappings.find(item => item.local === field);
      if (!mapping || !isName(mapping.source) || !writable.has(mapping.source)) throw new Error(`The ${field.replaceAll('_', ' ')} field is not configured for Dataverse contact creation.`);
      await addFlowWriteValue(context, mapping, value, payload);
    }
    if (values.email) {
      const mapping = settings.mappings.find(item => item.local === 'email');
      const duplicate = await flowRequest(environment, token, `${settings.entitySet}?$select=${settings.primaryId}&$filter=${encodeURIComponent(`${mapping.source} eq '${values.email.replaceAll("'", "''")}'`)}&$top=1`);
      if (duplicate.value?.length) throw new Error('A contact with this email already exists in Dataverse. Sync that contact instead.');
    }
    try { await flowRequest(environment, token, settings.entitySet, { method: 'POST', headers: { Prefer: 'return=representation', 'MSCRM.SuppressDuplicateDetection': 'false' }, body: JSON.stringify(payload) }); }
    catch (error) { try { source = await flowRequest(environment, token, path); } catch { throw error; } }
    source ||= await flowRequest(environment, token, path);
  }
  const mapped = mappedFlowValues('contacts', settings, source);
  const result = await base44.entities.Contact.upsert([{ ...mapped, full_name: mapped.full_name || [mapped.first_name, mapped.last_name].filter(Boolean).join(' '), dataverse_id: input.requestId, status: 'active' }], { key: 'dataverse_id' });
  const person = result.records[0];
  if (!person?.id) throw new Error('Created in Dataverse, but ALSight could not refresh the contact. Retry this same form to finish without creating a duplicate.');
  return { person, notice: 'Created in Dataverse under your connected account and added to ALSight.' };
}