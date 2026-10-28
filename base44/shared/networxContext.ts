import { dataverseRoles, personalDataverseContext, getPersonalDataverseToken } from './dataverseUserAuth.ts';
import { isGuid } from './dataverseFlowFields.ts';
export async function networxContext(client, input) {
  const statusOf = error=>Number(error?.response?.status || error?.status);
  const user = await client.auth.me().catch(error=>statusOf(error)===401 ? null : Promise.reject(error));
  if (!user) throw Object.assign(new Error('Sign in to use Networx.'),{status:401});
  if (!dataverseRoles.includes(user.role) || user.page_access?.network === false) throw Object.assign(new Error('Networx is available to authorised internal staff only.'),{status:403});
  const record = await client.entities[input.entity==='account' ? 'Account' : 'Contact'].get(input.recordId).catch(error=>statusOf(error)===404 ? null : Promise.reject(error));
  if (!record) throw Object.assign(new Error('This relationship record is unavailable.'),{status:404});
  if (!isGuid(record.dataverse_id)) return {state:'not_linked',items:[],message:'This record is not linked to Dataverse yet.'};
  const {environment,record:connection} = await personalDataverseContext(client,user);
  if (connection?.status !== 'connected') return {state:'connection_required',items:[],message:'Connect your own Dataverse account in Account Settings to use Networx.'};
  const token = await getPersonalDataverseToken(client,user,environment,connection);
  return {environment,token,sourceId:record.dataverse_id.toLowerCase(),entity:input.entity,userId:user.id,principalId:connection.dataverse_user_id,organisationId:connection.organisation_id};
}