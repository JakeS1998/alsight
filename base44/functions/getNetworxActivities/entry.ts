import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { dataverseRoles, personalDataverseContext, getPersonalDataverseToken } from '../../shared/dataverseUserAuth.ts';
import { isGuid } from '../../shared/dataverseFlowFields.ts';
import { validateNetworxInput } from '../../shared/networxQueries.ts';
import { readNetworxActivities } from '../../shared/networxReads.ts';
export default async function(req) {
  try {
    const client = createClientFromRequest(req);
    const statusOf = error => Number(error?.response?.status || error?.status);
    const user = await client.auth.me().catch(error=>statusOf(error)===401 ? null : Promise.reject(error));
    if (!user) return Response.json({error:'Sign in to view relationship activity.'},{status:401});
    if (!dataverseRoles.includes(user.role) || user.page_access?.network === false) return Response.json({error:'Relationship activity is available to authorised internal staff only.'},{status:403});
    if (req.method !== 'POST') return Response.json({error:'Method not allowed.'},{status:405});
    const input = await req.json().catch(()=>({}));
    const invalid = validateNetworxInput(input);
    if (invalid) return Response.json({error:invalid},{status:400});
    // Resolve the source identity only through a record this ALS Hub user may read.
    const record = await client.entities[input.entity==='account' ? 'Account' : 'Contact'].get(input.recordId).catch(error=>statusOf(error)===404 ? null : Promise.reject(error));
    if (!record) return Response.json({error:'This relationship record is unavailable.'},{status:404});
    if (!isGuid(record.dataverse_id)) return Response.json({state:'not_linked',items:[],message:'This record is not linked to Dataverse yet.'});
    const {environment,record:connection} = await personalDataverseContext(client,user);
    if (connection?.status !== 'connected') return Response.json({state:'connection_required',items:[],message:'Connect your own Dataverse account in Account Settings to view its activity. Mailbox approval is not needed to read activity.'});
    const token = await getPersonalDataverseToken(client,user,environment,connection);
    const result = await readNetworxActivities({environment,token,sourceId:record.dataverse_id.toLowerCase(),entity:input.entity,userId:user.id,principalId:connection.dataverse_user_id},input);
    return Response.json(result,{headers:{'Cache-Control':'no-store'}});
  } catch (error) {
    const code = Number(error?.response?.status || error?.status);
    const status = [400,401,403,404,429].includes(code) ? code : 502;
    return Response.json({error:error.message || 'Dataverse activity could not be loaded.'},{status});
  }
}