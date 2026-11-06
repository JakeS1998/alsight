import {dataverseRoles,personalDataverseContext,getPersonalDataverseToken,delegatedDataverseIdentity} from './dataverseUserAuth.ts';
import {flowRequest} from './dataverseFlowApi.ts';
const guid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export const approvalGuid=value=>typeof value==='string'&&guid.test(value);
export async function microsoftApprovalContext(base44,user){
 if(!dataverseRoles.includes(user.role))return {connected:false,reason:'Microsoft approval access requires an internal work account.'};
 const {environment,record}=await personalDataverseContext(base44,user);
 if(record?.status!=='connected')return {connected:false,reason:'Connect your own Dataverse account to see approvals assigned to your Microsoft identity.'};
 const token=await getPersonalDataverseToken(base44,user,environment,record);
 const [identity,organisation]=await Promise.all([delegatedDataverseIdentity(environment,token),flowRequest(environment,token,"RetrieveCurrentOrganization(AccessType=Microsoft.Dynamics.CRM.EndpointAccessType'Default')")]);
 const environmentId=organisation.Detail?.EnvironmentId;
 if(!approvalGuid(environmentId))throw new Error('Dataverse did not return a valid Microsoft environment identity.');
 return {connected:true,environment,token,userId:identity.dataverse_user_id,environmentId};
}
export const microsoftApprovalLink=(context,id)=>`https://make.powerautomate.com/environments/${encodeURIComponent(context.environmentId)}/approvals/received/${encodeURIComponent(id)}`;
export async function readMicrosoftApproval(context,xml){
 return await flowRequest(context.environment,context.token,`msdyn_flow_approvals?fetchXml=${encodeURIComponent(xml)}`,{headers:{Prefer:'odata.include-annotations="*"'}});
}