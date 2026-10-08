import { flowRequest } from './dataverseFlowApi.ts';
import { isName } from './dataverseFlowFields.ts';
export async function flowLookupMetadata(context, logicalName) {
  const data = await flowRequest(context.environment, context.token, `EntityDefinitions(LogicalName='${logicalName}')/ManyToOneRelationships?$select=ReferencingAttribute,ReferencingEntityNavigationPropertyName,ReferencedEntity`);
  if (data['@odata.nextLink']) throw new Error('Relationship metadata needs additional pages before write-back can be configured.');
  const targets = {};
  for (const row of data.value || []) {
    if (!isName(row.ReferencingAttribute) || !isName(row.ReferencedEntity) || typeof row.ReferencingEntityNavigationPropertyName !== 'string' || !/^[a-zA-Z][a-zA-Z0-9_]{0,100}$/.test(row.ReferencingEntityNavigationPropertyName)) continue;
    (targets[row.ReferencingAttribute] ||= []).push({ entity: row.ReferencedEntity, navigation: row.ReferencingEntityNavigationPropertyName });
  }
  return targets;
}