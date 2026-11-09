import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { flowConfig, flowRequest, sharedFlowContext } from '../../shared/dataverseFlowApi.ts';

export default async function(req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(error => error.status === 401 ? null : Promise.reject(error));
  if (!user) return Response.json({ error: 'Sign in required.' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Administrator access required for app inspection.' }, { status: 403 });
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405 });
  try {
    // Builder-authorised, read-only inspection of this fixed app through the confirmed shared connection.
    const config = await flowConfig(base44);
    if (config?.source_email?.toLowerCase() !== 'jake@allianceleisure.co.uk') return Response.json({ error: 'Jake is not the confirmed shared Dataverse connection.' }, { status: 409 });
    const { environment, token } = await sharedFlowContext(base44, config);
    if (environment !== 'https://alslive.crm11.dynamics.com') return Response.json({ error: 'The connected environment does not match the BSS Hub app.' }, { status: 409 });
    const app = await flowRequest(environment, token, 'appmodules(e986c390-c4b0-f011-bbd3-6045bd0e7eeb)?$select=appmoduleid,appmoduleidunique,name,uniquename,description');
    const components = await flowRequest(environment, token, `appmodulecomponents?$select=componenttype,objectid&$filter=_appmoduleidunique_value eq ${app.appmoduleidunique}&$top=200`);
    const resolved = [];
    for (let offset = 0; offset < components.value.length; offset += 5) {
      const batch = await Promise.all(components.value.slice(offset, offset + 5).map(async component => {
        const paths = { 1: `EntityDefinitions(${component.objectid})?$select=LogicalName,EntitySetName,PrimaryNameAttribute,DisplayName`, 26: `savedqueries(${component.objectid})?$select=name,returnedtypecode,fetchxml,layoutxml`, 60: `systemforms(${component.objectid})?$select=name,objecttypecode,formxml`, 62: `sitemaps(${component.objectid})?$select=sitemapxml` };
        if (!paths[component.componenttype]) return component;
        const detail = await flowRequest(environment, token, paths[component.componenttype]).catch(error => ({ error: error.message }));
        return { ...component, detail };
      }));
      resolved.push(...batch);
    }
    return Response.json({ app, components: resolved, has_more: Boolean(components['@odata.nextLink']), permission_scope: 'Read-only app inspection using Jake’s confirmed shared Dataverse connection, explicitly authorised by the builder; not a user login and not runtime permission delegation.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: error.status && error.status >= 400 && error.status < 500 ? error.status : 502 });
  }
}