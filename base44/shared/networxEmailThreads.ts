import {isGuid} from './dataverseFlowFields.ts';
import {networxScope} from './networxQueries.ts';
export const networxEmailFields='activityid,subject,modifiedon,createdon,actualstart,actualend,scheduledstart,scheduledend,_ownerid_value,statuscode,directioncode,conversationindex,conversationtrackingid,_parentactivityid_value';
export const networxEmailScope=context=>networxScope(context.sourceId,false,context.entity).replaceAll('activitypointer_activity_parties','email_activity_parties');
export function networxConversationRoot(index) {
 if(typeof index!=='string' || index.length>2048 || !/^[A-Za-z0-9+/]+=*$/.test(index))return null;
 try {const bytes=atob(index);return bytes.length>=22 ? btoa(bytes.slice(0,22)) : null;}catch{return null;}
}
export function networxEmailThreadInfo(row) {
 const root=networxConversationRoot(row.conversationindex),tracking=isGuid(row.conversationtrackingid) ? row.conversationtrackingid.toLowerCase() : null,parent=isGuid(row._parentactivityid_value) ? row._parentactivityid_value.toLowerCase() : null;
 return {threadId:root || tracking || parent || row.activityid,threadAliases:[`email:${row.activityid.toLowerCase()}`,...(root ? [`index:${root}`] : []),...(tracking ? [`email:${tracking}`] : []),...(parent ? [`email:${parent}`] : [])],direction:row.directioncode===true ? 'outgoing' : row.directioncode===false ? 'incoming' : null,emailStatus:row.statuscode};
}
export function networxEmailThreadFilter(row) {
 const root=networxConversationRoot(row.conversationindex),id=row.conversationtrackingid || row._parentactivityid_value || row.activityid;
 return `(${[`activityid eq ${row.activityid}`,`activityid eq ${id}`,`conversationtrackingid eq ${id}`,`_parentactivityid_value eq ${id}`,`_parentactivityid_value eq ${row.activityid}`,...(root ? [`startswith(conversationindex,'${root.slice(0,29)}')`] : [])].join(' or ')})`;
}