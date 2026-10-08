import { flowRequest } from './dataverseFlowApi.ts';
import { flowSpecs, isName } from './dataverseFlowFields.ts';
import { dataverseSourceType } from './dataverseSourceTypes.ts';
import { flowChoiceMetadata } from './dataverseChoiceMetadata.ts';
import { suggestFlowMappings } from './dataverseFlowSuggestions.ts';
import { flowLookupMetadata } from './dataverseLookupMetadata.ts';
import { matchFlowChoices } from './dataverseChoiceMatching.ts';
export async function discoverFlowTables(context, table) {
  const names = flowSpecs[table]?.sourceNames || [];
  const filter = names.flatMap(name => [`LogicalName eq '${name}'`, `EntitySetName eq '${name}'`]).join(' or ');
  const data = await flowRequest(context.environment, context.token, `EntityDefinitions?$select=LogicalName,EntitySetName,PrimaryIdAttribute,PrimaryNameAttribute&$filter=${encodeURIComponent(filter)}`);
  return (data.value || []).filter(row => isName(row.LogicalName) && isName(row.EntitySetName) && isName(row.PrimaryIdAttribute));
}
export async function inspectFlowTable(context, table, logicalName) {
  const candidates = await discoverFlowTables(context, table);
  const meta = candidates.find(row => row.LogicalName === logicalName);
  if (!meta) throw new Error('Choose one of the discovered Dataverse tables.');
  const data = await flowRequest(context.environment, context.token, `EntityDefinitions(LogicalName='${meta.LogicalName}')/Attributes?$select=LogicalName,AttributeType,IsValidForRead,IsValidForUpdate,DisplayName`);
  if (data['@odata.nextLink']) throw new Error('Metadata needs additional pages. Ask IT to narrow this table.');
  const [choices, lookupTargets] = await Promise.all([flowChoiceMetadata(context, meta.LogicalName), flowLookupMetadata(context, meta.LogicalName)]);
  const lookupLabels = new Set((data.value || []).filter(a => a.AttributeType === 'Lookup').flatMap(a => [`${a.LogicalName}name`, `${a.LogicalName}yominame`]));
  const fields = (data.value || []).filter(a => a.IsValidForRead && isName(a.LogicalName) && !lookupLabels.has(a.LogicalName)).map(a => ({ name: a.LogicalName, type: a.AttributeType, localType: dataverseSourceType(a.AttributeType), label: a.DisplayName?.UserLocalizedLabel?.Label || a.LogicalName, queryName: a.AttributeType === 'Lookup' ? `_${a.LogicalName}_value` : a.LogicalName, writable: Boolean(a.IsValidForUpdate) && a.LogicalName !== meta.PrimaryIdAttribute, lookupTargets: lookupTargets[a.LogicalName] || [], options: choices[a.LogicalName] || (a.AttributeType === 'Boolean' ? [{ value: 'false', label: 'No' }, { value: 'true', label: 'Yes' }] : []) }));
  const inspected = { logicalName: meta.LogicalName, entitySet: meta.EntitySetName, primaryId: meta.PrimaryIdAttribute, primaryName: meta.PrimaryNameAttribute, fields };
  return { ...inspected, suggestions: suggestFlowMappings(table, inspected), ...(table === 'projects' && meta.LogicalName === 'bss_project1' ? { warning: 'This is a separate table from the currently linked project table. Confirm its meaning and review record matches before replacing project records.' } : {}) };
}
export function validateMapping(table, inspected, mappings) {
  if (!Array.isArray(mappings) || mappings.length > 100) throw new Error('Choose up to 100 mapped fields.');
  const spec = flowSpecs[table], seen = new Set(), sources = new Set();
  const result = mappings.map(item => {
    const source = inspected.fields.find(f => f.name === item.source);
    if (!spec.fields[item.local] || !source || seen.has(item.local) || sources.has(item.source)) throw new Error('The mapping contains an invalid or duplicate field.');
    const localType = dataverseSourceType(source.type);
    if (item.write && !source.writable) throw new Error('Dataverse marks this column as read-only. Choose an editable column for write-back.');
    if (table === 'users' && item.local === 'dataverse_systemuser_id' && (item.write || source.name !== inspected.primaryId)) throw new Error('The systemuser identity must remain linked to its read-only primary ID.');
    const lookupTarget = source.type === 'Lookup' ? source.lookupTargets?.find(target => target.entity === item.lookupTarget?.entity && target.navigation === item.lookupTarget?.navigation) || (source.lookupTargets?.length === 1 ? source.lookupTargets[0] : undefined) : undefined;
    if (item.write && source.type === 'Lookup' && !lookupTarget) throw new Error(`Choose a lookup target table for ${item.local}.`);
    let values;
    if (['Picklist', 'State', 'Status'].includes(source.type)) {
      values = matchFlowChoices(source.options, spec.enums?.[item.local], item.values);
      for (const option of source.options) {
        const value = values[option.value];
        const fixedChoice = item.local === 'status' || (table === 'accounts' && item.local === 'account_type');
        if (typeof value !== 'string' || (fixedChoice && spec.enums?.[item.local] && !spec.enums[item.local].includes(value))) throw new Error(`“${option.label}” must map to an existing ${item.local.replaceAll('_', ' ')} value to preserve ALSight classification.`);
        values[option.value] = value;
      }
      if (!source.options.length) throw new Error('Dataverse did not return choices for this field.');

    }
    seen.add(item.local); sources.add(item.source);
    const automatic = inspected.suggestions?.some(m => m.local === item.local && m.source === source.name);
    return { local: item.local, source: source.name, queryName: source.queryName, type: source.type, write: Boolean(item.write), localType, origin: item.origin === 'manual' ? 'manual' : automatic ? 'automatic' : 'manual', ...(values ? { values, choiceOptions: source.options } : {}), ...(lookupTarget ? { lookupTarget } : {}) };
  });
  if (!seen.has(spec.required)) throw new Error(`Map ${spec.required.replaceAll('_', ' ')} before synchronising this table.`);
  return result;
}