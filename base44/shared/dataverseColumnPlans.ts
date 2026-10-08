import { flowSpecs } from './dataverseFlowFields.ts';
export function sameFlowMapping(table, previous, mappings, logicalName) {
  const canonical = items => (items || []).map(m => ({ local: m.local, source: m.source, type: m.type, write: Boolean(m.write), localType: m.localType || flowSpecs[table].fields[m.local], queryName: m.queryName || m.source, lookupTarget: m.lookupTarget || null, choiceOptions: m.choiceOptions || [], values: Object.entries(m.values || {}).sort(([a], [b]) => a.localeCompare(b)) })).sort((a, b) => a.local.localeCompare(b.local));
  return previous?.logicalName === logicalName && JSON.stringify(canonical(previous.mappings)) === JSON.stringify(canonical(mappings));
}
export function validateColumnPlans(table, mappings, plans = {}) {
  if (!plans || typeof plans !== 'object' || Array.isArray(plans)) throw new Error('Invalid column setup.');
  const spec = flowSpecs[table], columns = new Set([...Object.keys(spec.fields), ...(spec.preservedFields || [])]);
  if (Object.keys(plans).length > 150) throw new Error('Too many column decisions.');
  const mapped = new Set(mappings.map(m => m.local)), result = {};
  for (const [field, mode] of Object.entries(plans)) {
    if (!columns.has(field) || !['base44_only', 'needs_dataverse'].includes(mode)) throw new Error('Invalid column decision.');
    if (mapped.has(field)) throw new Error(`Remove the mapping for ${field} before marking it as local-only or requiring a new column.`);
    if (field === spec.required) throw new Error('The required identity/name column must remain mapped.');
    result[field] = mode;
  }
  return result;
}