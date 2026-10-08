import {approvalEntity} from './documentApprovalRecords.ts';
import {flowConfig,sharedFlowContext,flowRequest} from './dataverseFlowApi.ts';
import {isGuid} from './dataverseFlowFields.ts';
// Only refresh the mapped document dates and approval fields, never write to Dataverse.
export async function refreshDocumentApprovalDates(base44,table,documents) {
 if(documents.length>50)throw new Error('Check at most 50 document dates at a time.');
 const ids=[...new Set(documents.map(d=>d.dataverse_id).filter(isGuid))];
 if(!ids.length)return {documents,checked:0,missing:documents.length};
 const config=await flowConfig(base44),settings=config?.tables?.[table];
 const fields=['drafted_date','approval_date','approval_status','approval_comments','approvers_name'];
 const mappings=fields.map(local=>settings?.mappings?.find(m=>m.local===local)).filter(Boolean);
 if(!settings || !['drafted_date','approval_date'].every(field=>mappings.some(m=>m.local===field)))throw new Error('Map both the drafted date and approval date before checking live document dates.');
 const context=await sharedFlowContext(base44,config);
 const select=[...new Set([settings.primaryId,...mappings.map(m=>m.queryName || m.source)])].join(',');
 const filter=ids.map(id=>`${settings.primaryId} eq ${id}`).join(' or ');
 const data=await flowRequest(context.environment,context.token,`${settings.entitySet}?$select=${select}&$filter=${encodeURIComponent(filter)}&$top=50`);
 if(!Array.isArray(data.value) || data.value.length>50)throw new Error('Dataverse returned an invalid document date batch.');
 const rows=new Map(data.value.map(row=>[String(row[settings.primaryId]).toLowerCase(),row])),changes=[];
 const refreshed=documents.map(document=>{
  const row=rows.get(document.dataverse_id?.toLowerCase());
  if(!row)return document;
  const values=Object.fromEntries(mappings.map(m=>[m.local,row[m.queryName || m.source] ?? null]));
  if(Object.values(values).some(value=>value!==null && typeof value!=='string'))throw new Error('Dataverse returned an invalid document approval field.');
  if(Object.entries(values).some(([field,value])=>document[field]!==value))changes.push({id:document.id,...values});
  return {...document,...values};
 });
 if(changes.length)await base44.asServiceRole.entities[approvalEntity(table)].bulkUpdate(changes);
 return {documents:refreshed,checked:rows.size,missing:ids.length-rows.size};
}