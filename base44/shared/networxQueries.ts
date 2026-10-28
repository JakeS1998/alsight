import { isGuid } from './dataverseFlowFields.ts';
export const networxTypes = ['email', 'appointment', 'phonecall', 'task'];
export function validateNetworxInput(input) {
  if (!input || !['account','contact'].includes(input.entity) || typeof input.recordId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(input.recordId)) return 'Choose a client, supplier or person.';
  if (!['list','detail'].includes(input.action || 'list')) return 'Invalid activity operation.';
  if (input.action === 'detail' && (!isGuid(input.activityId) || ![...networxTypes,'annotation'].includes(input.kind))) return 'Choose a valid activity.';
  const cursor = input.cursor;
  if (cursor != null && (typeof cursor !== 'string' || cursor.length > 150000 || !/^[a-zA-Z0-9_-]{16}\.[a-zA-Z0-9_-]+$/.test(cursor))) return 'Invalid activity page. Refresh the timeline.';
  return null;
}
export function networxScope(sourceId, note, entity) {
  return note ? `objectid_${entity}/${entity}id eq ${sourceId}` : `(regardingobjectid_${entity}/${entity}id eq ${sourceId} or activitypointer_activity_parties/any(p:p/partyid_${entity}/${entity}id eq ${sourceId}))`;
}
export function networxQuery(sourceId, input, note = false, pendingIds = null) {
  const detail = input.action === 'detail', key = note ? 'annotationid' : 'activityid';
  const fields = note ? ['annotationid','subject','modifiedon','createdon','_createdby_value','filename','isdocument'] : ['activityid','subject','activitytypecode','modifiedon','createdon','scheduledstart','scheduledend','actualstart','actualend','statecode','statuscode','_ownerid_value'];
  let filter = networxScope(sourceId, note, input.entity);
  if (!note) filter += ` and (${networxTypes.map(type => `activitytypecode eq '${type}'`).join(' or ')})`;
  if (detail) {
    filter += ` and ${key} eq ${input.activityId}`;
    if (!note) filter += ` and activitytypecode eq '${input.kind}'`;
    fields.push(note ? 'notetext' : 'description');
  }
  const query = new URLSearchParams({ '$select': fields.join(','), '$filter': filter, '$orderby': `modifiedon desc,${key} desc` });
  if (detail) query.set('$top','1');
  if (pendingIds?.length) {
    query.set('$filter', `${filter} and (${pendingIds.map(id=>`${key} eq ${id}`).join(' or ')})`);
    query.set('$top',String(pendingIds.length));
  }
  if (detail && !note) query.set('$expand','activitypointer_activity_parties($select=_partyid_value,participationtypemask,addressused)');
  return `${note ? 'annotations' : 'activitypointers'}?${query}`;
}