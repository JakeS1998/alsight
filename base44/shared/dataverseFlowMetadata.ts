import { flowRequest } from './dataverseFlowApi.ts';
import { flowSpecs, isName, compatibleType } from './dataverseFlowFields.ts';
export async function discoverFlowTables(context, table) {
  const filter = table === 'contacts' ? "LogicalName eq 'contact'" : "LogicalName eq 'bss_projects' or LogicalName eq 'bss_project' or EntitySetName eq 'bss_projects'";
  const data = await flowRequest(context.environment, context.token, `EntityDefinitions?$select=LogicalName,EntitySetName,PrimaryIdAttribute,PrimaryNameAttribute&$filter=${encodeURIComponent(filter)}`);
  return (data.value || []).filter(row => isName(row.LogicalName) && isName(row.EntitySetName) && isName(row.PrimaryIdAttribute));
}
export async function inspectFlowTable(context, table, logicalName) {
  const candidates = await discoverFlowTables(context, table);
  const meta = candidates.find(row => row.LogicalName === logicalName);
  if (!meta) throw new Error('Choose one of the discovered Dataverse tables.');
  const data = await flowRequest(context.environment, context.token, `EntityDefinitions(LogicalName='${meta.LogicalName}')/Attributes?$select=LogicalName,AttributeType,IsValidForRead,IsValidForUpdate`);
  if (data['@odata.nextLink']) throw new Error('This table has too many fields to inspect in one request. Ask IT for a narrower mapping.');
  const fields = (data.value || []).filter(a => a.IsValidForRead && isName(a.LogicalName) && Object.values(flowSpecs[table].fields).some(type => compatibleType(type, a.AttributeType))).map(a => ({ name: a.LogicalName, type: a.AttributeType, writable: Boolean(a.IsValidForUpdate) }));
  return { logicalName: meta.LogicalName, entitySet: meta.EntitySetName, primaryId: meta.PrimaryIdAttribute, fields };
}
export function validateMapping(table, inspected, mappings) {
  if (!Array.isArray(mappings) || mappings.length > 25) throw new Error('Choose up to 25 mapped fields.');
  const spec = flowSpecs[table], seen = new Set(), sources = new Set();
  const result = mappings.map(item => {
    const source = inspected.fields.find(f => f.name === item.source);
    if (!spec.fields[item.local] || !source || !compatibleType(spec.fields[item.local], source.type) || seen.has(item.local) || sources.has(item.source)) throw new Error('The mapping contains an invalid, duplicate or incompatible field.');
    if (item.write && (!source.writable || (table === 'contacts' && item.local === 'full_name'))) throw new Error('A selected field is read-only. Contact full name is derived from first and last name.');
    seen.add(item.local); sources.add(item.source);
    return { local: item.local, source: source.name, type: source.type, write: Boolean(item.write), localType: spec.fields[item.local] };
  });
  if (!seen.has(spec.required)) throw new Error(`Map ${spec.required.replaceAll('_', ' ')} before synchronising this table.`);
  return result;
}