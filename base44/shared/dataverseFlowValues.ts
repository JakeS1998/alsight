import { flowSpecs, validateFlowValue } from './dataverseFlowFields.ts';
export function flowSelection(settings, table) {
  return [...new Set([settings.primaryId, ...settings.mappings.map(m => m.queryName || m.source), ...(table === 'users' ? ['internalemailaddress', 'fullname'] : [])])].join(',');
}
export function mappedFlowValues(table, settings, row) {
  const values = {}, spec = flowSpecs[table];
  for (const m of settings.mappings) {
    let value = row[m.queryName || m.source] ?? null;
    if (value !== null && m.values) {
      if (!Object.prototype.hasOwnProperty.call(m.values, String(value))) throw new Error(`Unmapped Dataverse choice for ${m.local}. Review this field's option mapping.`);
      value = m.values[String(value)];
    }
    if (value !== null && spec.enums?.[m.local] && !spec.enums[m.local].includes(value)) throw new Error(`Invalid choice for ${m.local}. Review the option mapping.`);
    if ((value === null || value === '') && spec.enums?.[m.local]) {
      values[m.local] = spec.enums[m.local].includes('') ? '' : null;
    } else values[m.local] = validateFlowValue(m.localType, value, false, 10000);
    if (/^email[23]?$/.test(m.local) && values[m.local] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values[m.local])) throw new Error(`Dataverse contains an invalid email for ${m.local}.`);
    if (m.local === 'sqq_expiry' || m.local === 'commercial_start' || m.local === 'commercial_end') values[m.local] = values[m.local]?.slice(0, 10) || null;
  }
  return values;
}
export const reviewScope = (context, table, settings) => ({ environment_url: context.environment, table, mapping_revision: settings.revision || 'legacy', logical_name: settings.logicalName });
export const normalisedEmail = email => String(email || '').trim().toLowerCase();