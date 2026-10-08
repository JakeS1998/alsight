import { flowRequest } from './dataverseFlowApi.ts';
import { flowSpecs, isName, compatibleType } from './dataverseFlowFields.ts';
import { flowChoiceMetadata } from './dataverseChoiceMetadata.ts';
import { suggestFlowMappings } from './dataverseFlowSuggestions.ts';
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
  const choices = await flowChoiceMetadata(context, meta.LogicalName);
  const fields = (data.value || []).filter(a => a.IsValidForRead && isName(a.LogicalName) && Object.values(flowSpecs[table].fields).some(type => compatibleType(type, a.AttributeType))).map(a => ({ name: a.LogicalName, type: a.AttributeType, label: a.DisplayName?.UserLocalizedLabel?.Label || a.LogicalName, queryName: a.AttributeType === 'Lookup' ? `_${a.LogicalName}_value` : a.LogicalName, writable: Boolean(a.IsValidForUpdate) && !['Lookup', 'Uniqueidentifier', 'Picklist', 'State', 'Status'].includes(a.AttributeType), options: choices[a.LogicalName] || (a.AttributeType === 'Boolean' ? [{ value: 'false', label: 'No' }, { value: 'true', label: 'Yes' }] : []) }));
  const inspected = { logicalName: meta.LogicalName, entitySet: meta.EntitySetName, primaryId: meta.PrimaryIdAttribute, primaryName: meta.PrimaryNameAttribute, fields };
  return { ...inspected, suggestions: suggestFlowMappings(table, inspected), ...(table === 'projects' && meta.LogicalName === 'bss_project1' ? { warning: 'This is a separate table from the currently linked project table. Confirm its meaning and review record matches before replacing project records.' } : {}) };
}
export function validateMapping(table, inspected, mappings) {
  if (!Array.isArray(mappings) || mappings.length > 100) throw new Error('Choose up to 100 mapped fields.');
  const spec = flowSpecs[table], seen = new Set(), sources = new Set();
  const result = mappings.map(item => {
    const source = inspected.fields.find(f => f.name === item.source);
    if (!spec.fields[item.local] || !source || !compatibleType(spec.fields[item.local], source.type) || seen.has(item.local) || sources.has(item.source)) throw new Error('The mapping contains an invalid, duplicate or incompatible field.');
    if (item.write && (!source.writable || (table === 'contacts' && item.local === 'full_name'))) throw new Error('A selected field is read-only. Contact full name is derived from first and last name.');
    if (table === 'users' && (item.write || (item.local === 'dataverse_systemuser_id' && source.name !== inspected.primaryId))) throw new Error('User sync cannot change logins or write back. Map the systemuser ID to its primary ID only.');
    let values;
    if (['Picklist', 'State', 'Status'].includes(source.type) || (source.type === 'Boolean' && spec.fields[item.local] === 'String')) {
      values = {};
      for (const option of source.options) {
        const value = spec.enums?.[item.local] ? item.values?.[option.value] : option.label;
        if (typeof value !== 'string' || (spec.enums?.[item.local] && !spec.enums[item.local].includes(value))) throw new Error(`Map every choice for ${item.local}, or leave the field unmapped.`);
        values[option.value] = value;
      }
      if (!source.options.length) throw new Error('Dataverse did not return choices for this field.');
      if (item.write) throw new Error('Transformed choice fields are read-only in this sync workspace.');
    }
    seen.add(item.local); sources.add(item.source);
    const automatic = inspected.suggestions?.some(m => m.local === item.local && m.source === source.name);
    return { local: item.local, source: source.name, queryName: source.queryName, type: source.type, write: Boolean(item.write), localType: spec.fields[item.local], origin: item.origin === 'manual' ? 'manual' : automatic ? 'automatic' : 'manual', ...(values ? { values } : {}) };
  });
  if (!seen.has(spec.required)) throw new Error(`Map ${spec.required.replaceAll('_', ' ')} before synchronising this table.`);
  return result;
}