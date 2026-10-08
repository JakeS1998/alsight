import { flowRequest } from './dataverseFlowApi.ts';
export async function flowChoiceMetadata(context, logicalName) {
  const groups = await Promise.all(['Picklist', 'State', 'Status'].map(type => flowRequest(context.environment, context.token, `EntityDefinitions(LogicalName='${logicalName}')/Attributes/Microsoft.Dynamics.CRM.${type}AttributeMetadata?$select=LogicalName&$expand=OptionSet($select=Options)`)));
  return Object.fromEntries(groups.flatMap(group => (group.value || []).map(field => [field.LogicalName, (field.OptionSet?.Options || []).map(option => ({ value: String(option.Value), label: option.Label?.UserLocalizedLabel?.Label || option.Label?.LocalizedLabels?.[0]?.Label || String(option.Value) }))])));
}