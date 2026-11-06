import {approvalGuid,microsoftApprovalContext,microsoftApprovalLink,readMicrosoftApproval} from './microsoftApprovalContext.ts';
import {flowRequest} from './dataverseFlowApi.ts';
const escape=value=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const fields=['msdyn_flow_approvalid','msdyn_flow_approval_title','msdyn_flow_approval_details','msdyn_flow_approval_result','msdyn_flow_approval_dueon','msdyn_flow_approval_completedon','msdyn_flow_approval_itemlink','msdyn_flow_approval_itemlinkdescription','createdon','statuscode'];
const statuses={192350000:'Created',192350001:'Pending',192350002:'Suspended',192350004:'Completed',192350005:'Expired',192350006:'Cancelled',192350007:'Abandoned'};
const sourceLink=value=>{try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}};
function query(context,input,id){
 const pending=input.view==='pending',search=input.search?.trim();
 return `<fetch count="25" page="${input.page||1}"><entity name="msdyn_flow_approval">${fields.map(name=>`<attribute name="${name}"/>`).join('')}<order attribute="createdon" descending="${!pending}"/><order attribute="msdyn_flow_approvalid"/><filter>${id?`<condition attribute="msdyn_flow_approvalid" operator="eq" value="${id}"/>`:''}${pending?'<condition attribute="statuscode" operator="eq" value="192350001"/>':''}${search?`<condition attribute="msdyn_flow_approval_title" operator="like" value="%${escape(search.replace(/[%_\[\]]/g,''))}%"/>`:''}</filter><link-entity name="msdyn_flow_approvalrequest" from="msdyn_flow_approvalrequest_approval" to="msdyn_flow_approvalid" link-type="exists" alias="assigned"><filter><condition attribute="ownerid" operator="eq" value="${context.userId}"/>${pending?'<condition attribute="statecode" operator="eq" value="0"/>':''}</filter></link-entity></entity></fetch>`;
}
function view(context,row){
 return {id:row.msdyn_flow_approvalid,title:row.msdyn_flow_approval_title||'Microsoft approval',details:row.msdyn_flow_approval_details||'',status:statuses[row.statuscode]||'Not confirmed',result:row.msdyn_flow_approval_result||'',createdAt:row.createdon,dueAt:row.msdyn_flow_approval_dueon,completedAt:row.msdyn_flow_approval_completedon,microsoftUrl:microsoftApprovalLink(context,row.msdyn_flow_approvalid),sourceUrl:sourceLink(row.msdyn_flow_approval_itemlink),sourceLabel:row.msdyn_flow_approval_itemlinkdescription||'Open source document'};
}
export async function microsoftApprovalRead(base44,user,input){
 if(input.action==='microsoftList'&&(!['pending','all'].includes(input.view)||!Number.isInteger(input.page)||input.page<1||input.page>2000||typeof input.search!=='string'||input.search.length>120))throw new Error('Choose a valid Microsoft approval view, page and search.');
 if(input.action==='microsoftDetail'&&!approvalGuid(input.approvalId))throw new Error('Choose a valid Microsoft approval.');
 const context=await microsoftApprovalContext(base44,user);
 if(!context.connected)return context;
 const detail=input.action==='microsoftDetail';
 const rows=await readMicrosoftApproval(context,query(context,detail?{view:'all',page:1}:input,detail?input.approvalId:null));
 if(!detail)return {connected:true,items:(rows.value||[]).map(row=>view(context,row)),hasMore:rows['@Microsoft.Dynamics.CRM.morerecords']===true||!!rows['@Microsoft.Dynamics.CRM.fetchxmlpagingcookie'],checkedAt:new Date().toISOString()};
 const row=rows.value?.[0];
 if(!row)throw new Error('This approval is not assigned to your connected Microsoft account, or is no longer accessible.');
 const responses=await flowRequest(context.environment,context.token,`msdyn_flow_approvalresponses?$select=msdyn_flow_approvalresponse_response,msdyn_flow_approvalresponse_comments,createdon,_ownerid_value&$filter=_msdyn_flow_approvalresponse_approval_value eq ${input.approvalId}&$orderby=createdon asc&$top=50`,{headers:{Prefer:'odata.include-annotations="OData.Community.Display.V1.FormattedValue"'}});
 return {connected:true,approval:view(context,row),responses:(responses.value||[]).map(r=>({response:r.msdyn_flow_approvalresponse_response||'',comments:r.msdyn_flow_approvalresponse_comments||'',at:r.createdon,by:r['_ownerid_value@OData.Community.Display.V1.FormattedValue']||'Microsoft approver'})),moreResponses:!!responses['@odata.nextLink']};
}