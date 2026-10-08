import { flowSpecs } from './dataverseFlowFields.ts';

export function sourceFlowBlanks(table, settings) {
  if (!settings.dataverseOnly) return {};
  return Object.fromEntries(Object.entries(flowSpecs[table].fields)
    .filter(([field]) => settings.columnPlans?.[field] !== 'base44_only')
    .map(([field, type]) => [field, ['String', 'Memo', 'Lookup', 'Uniqueidentifier'].includes(type) ? '' : null]));
}