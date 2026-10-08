import { flowRequest } from './dataverseFlowApi.ts';
import { isName, validateFlowValue } from './dataverseFlowFields.ts';
export async function addFlowWriteValue(context, mapping, value, payload) {
  if (['Picklist', 'State', 'Status'].includes(mapping.type)) {
    if (value === null || value === '') { payload[mapping.source] = null; return; }
    if (!Number.isSafeInteger(value) || !mapping.choiceOptions?.some(option => Number(option.value) === value)) throw new Error('Choose a valid Dataverse option.');
    payload[mapping.source] = value;
    return;
  }
  const validated = validateFlowValue(mapping.localType, value, mapping.local === context.spec.required);
  if (mapping.type === 'Lookup') {
    const target = mapping.lookupTarget;
    if (!target || !isName(target.entity) || !/^[a-zA-Z][a-zA-Z0-9_]{0,100}$/.test(target.navigation)) throw new Error('Reload column options and save a lookup target before enabling write-back.');
    const key = `${target.navigation}@odata.bind`;
    if (!validated) { payload[key] = null; return; }
    const meta = await flowRequest(context.environment, context.token, `EntityDefinitions(LogicalName='${target.entity}')?$select=EntitySetName`);
    if (!isName(meta.EntitySetName)) throw new Error('Dataverse did not return a valid lookup target table.');
    payload[key] = `/${meta.EntitySetName}(${validated})`;
    return;
  }
  if (['Integer', 'BigInt'].includes(mapping.type) && validated !== null && !Number.isInteger(validated)) throw new Error('This Dataverse field requires a whole number.');
  if (/^email[23]?$/.test(mapping.local) && validated && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(validated)) throw new Error('Enter a valid email address.');
  payload[mapping.source] = validated === '' ? null : validated;
}