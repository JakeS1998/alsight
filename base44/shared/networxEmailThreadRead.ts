import {flowRequest} from './dataverseFlowApi.ts';
import {networxReplySource} from './networxEmailReply.ts';
import {networxEmailFields,networxEmailScope,networxEmailThreadFilter,networxEmailThreadInfo} from './networxEmailThreads.ts';
import {networxActivityRow} from './networxActivityRow.ts';
import {decodeNetworxCursor,encodeNetworxCursor} from './networxCursor.ts';
export default async function networxEmailThreadRead(context,input) {
 const source=await networxReplySource(context,input.activityId,false),anchors=[source];
 if(source._parentactivityid_value){const parent=await networxReplySource(context,source._parentactivityid_value,false).catch(error=>error.status===404 ? null : Promise.reject(error));if(parent)anchors.push(parent);}
 const aliases=new Set(anchors.flatMap(row=>networxEmailThreadInfo(row).threadAliases));
 let path;
 if(input.cursor){const state=await decodeNetworxCursor(context,input.cursor);if(state?.type!=='email_thread' || state.activityId!==input.activityId || typeof state.next!=='string')throw Object.assign(new Error('Refresh this email conversation before loading more messages.'),{status:400});path=state.next;}
 else {const query=new URLSearchParams({'$select':networxEmailFields,'$filter':`${networxEmailScope(context)} and (${anchors.map(networxEmailThreadFilter).join(' or ')})`,'$orderby':'createdon desc,activityid desc'});path=`emails?${query}`;}
 const page=await flowRequest(context.environment,context.token,path,{headers:{Prefer:'odata.maxpagesize=20,odata.include-annotations="OData.Community.Display.V1.FormattedValue"'}});
 const items=(page.value || []).filter(row=>networxEmailThreadInfo(row).threadAliases.some(key=>aliases.has(key))).map(row=>networxActivityRow({...row,activitytypecode:'email'}));
 return {state:'ready',items,nextCursor:page['@odata.nextLink'] ? await encodeNetworxCursor(context,{type:'email_thread',activityId:input.activityId,next:page['@odata.nextLink']}) : null};
}