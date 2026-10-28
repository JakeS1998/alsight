import {networxEmailThreadInfo} from './networxEmailThreads.ts';
export const networxRowLabel=(row,field)=>row[`${field}@OData.Community.Display.V1.FormattedValue`] || '';
export function networxActivityRow(row,note=false) {
 const kind=note ? 'annotation' : row.activitytypecode;
 return {id:note ? row.annotationid : row.activityid,kind,subject:row.subject || (note ? 'Untitled note' : 'Untitled activity'),updated:new Date(row.modifiedon).toISOString(),created:row.createdon,occurred:note ? row.createdon : row.actualstart || row.scheduledstart || row.createdon,end:note ? null : row.actualend || row.scheduledend || null,status:note ? '' : networxRowLabel(row,'statuscode'),owner:networxRowLabel(row,note ? '_createdby_value' : '_ownerid_value'),filename:note && row.isdocument ? row.filename || 'Attached document' : null,...(kind==='email' ? networxEmailThreadInfo(row) : {})};
}