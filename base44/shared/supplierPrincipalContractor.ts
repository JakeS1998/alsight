import { flowConfig, sharedFlowContext, flowRequest } from './dataverseFlowApi.ts';
export async function supplierPrincipalContractor(base44, account) {
  if (account.account_type !== 'supplier' || !/^[a-f0-9-]{36}$/i.test(account.dataverse_id || '')) return false;
  const context = await sharedFlowContext(base44, await flowConfig(base44));
  const field = 'bss_servicesprovided';
  const [metadata, source] = await Promise.all([
    flowRequest(context.environment, context.token, `EntityDefinitions(LogicalName='account')/Attributes(LogicalName='${field}')/Microsoft.Dynamics.CRM.MultiSelectPicklistAttributeMetadata?$select=LogicalName&$expand=OptionSet($select=Options)`),
    flowRequest(context.environment, context.token, `accounts(${account.dataverse_id})?$select=${field}`),
  ]);
  const principal = (metadata.OptionSet?.Options || []).filter(option => (option.Label?.UserLocalizedLabel?.Label || option.Label?.LocalizedLabels?.[0]?.Label || '').trim().toLowerCase() === 'principal contractor').map(option => String(option.Value));
  if (!principal.length) throw new Error('Principal Contractor supplier category could not be verified.');
  return String(source[field] ?? '').split(',').some(value => principal.includes(value.trim()));
}