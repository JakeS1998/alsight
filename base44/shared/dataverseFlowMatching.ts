import { flowSpecs } from './dataverseFlowFields.ts';
import { normalisedEmail } from './dataverseFlowValues.ts';
import { staffEmailQuery } from './staffReportingIdentity.ts';
export async function findFlowTargets(base44, table, settings, rows, values) {
  const spec = flowSpecs[table], identity = spec.identityField || 'dataverse_id';
  const ids = rows.map(row => row[settings.primaryId]);
  if (table === 'users') {
    const emails = [...new Set(rows.map(row => normalisedEmail(row.internalemailaddress)).filter(Boolean))];
    if (!emails.length) return [];
    const result = await base44.entities.User.filter({ $or: emails.map(email => ({ email: staffEmailQuery(email) })) });
    return result.filter(user => emails.includes(normalisedEmail(user.email)));
  }
  const alternatives = [{ [identity]: { $in: ids } }];

  const page = await base44.entities[spec.entity].filter({ $or: alternatives }, { limit: 500, fields: [...new Set([identity, spec.required, spec.labelField || spec.required, ...(spec.matchFields || []), ...(table === 'accounts' ? ['account_type'] : []), ...settings.mappings.map(m => m.local)])] });
  if (page.has_more) throw new Error('Too many possible placeholder matches. Use a more specific identifier mapping.');
  return page.items;
}
export function matchingFlowTargets(table, row, values, targets) {
  const spec = flowSpecs[table], identity = spec.identityField || 'dataverse_id';
  if (table === 'users') return targets.filter(target => normalisedEmail(target.email) && normalisedEmail(target.email) === normalisedEmail(row.internalemailaddress));
  return targets.filter(target => !target[identity] && (spec.matchFields || [spec.required]).some(field => values?.[field] && target[field] === values[field]));
}