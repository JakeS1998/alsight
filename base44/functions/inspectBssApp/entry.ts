import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { personalDataverseContext, getPersonalDataverseToken } from '../../shared/dataverseUserAuth.ts';
import { flowRequest } from '../../shared/dataverseFlowApi.ts';

export default async function(req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(error => error.status === 401 ? null : Promise.reject(error));
  if (!user) return Response.json({ error: 'Sign in required.' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Administrator access required for app inspection.' }, { status: 403 });
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405 });
  try {
    const { environment, record } = await personalDataverseContext(base44, user);
    if (environment !== 'https://alslive.crm11.dynamics.com') return Response.json({ error: 'The connected environment does not match the BSS Hub app.' }, { status: 409 });
    if (!record || record.status !== 'connected') return Response.json({ error: 'Connect your own Dataverse account before inspecting BSS Hub.' }, { status: 409 });
    const token = await getPersonalDataverseToken(base44, user, environment, record);
    const app = await flowRequest(environment, token, 'appmodules(e986c390-c4b0-f011-bbd3-6045bd0e7eeb)?$select=appmoduleid,name,uniquename,description');
    const components = await flowRequest(environment, token, "appmodulecomponents?$select=componenttype,objectid&$filter=_appmoduleid_value eq e986c390-c4b0-f011-bbd3-6045bd0e7eeb&$top=200");
    return Response.json({ app, components: components.value, has_more: Boolean(components['@odata.nextLink']), permission_scope: 'Current administrator own delegated Microsoft identity; no shared account or application identity.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: error.status && error.status >= 400 && error.status < 500 ? error.status : 502 });
  }
}