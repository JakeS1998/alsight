import { secrets } from 'base44:runtime';

export function dataverseEnvironment(value) {
  const message = 'Enter the HTTPS Dataverse environment address supplied by IT, such as https://yourorganisation.crm11.dynamics.com.';
  if (typeof value !== 'string' || value.length > 250) throw new Error(message);
  let url;
  try { url = new URL(value.trim()); } catch { throw new Error(message); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash || !['', '/'].includes(url.pathname) || !/^[a-z0-9][a-z0-9-]*(?:\.api)?\.crm\d*\.dynamics\.com$/i.test(url.hostname)) throw new Error(message);
  return url.origin;
}

export async function checkDataverseIdentity(environment) {
  const origin = dataverseEnvironment(environment);
  const tenant = secrets.get('DATAVERSE_TENANT_ID')?.trim();
  const client = secrets.get('DATAVERSE_CLIENT_ID')?.trim();
  const secret = secrets.get('DATAVERSE_CLIENT_SECRET');
  const guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!guid.test(tenant || '') || !guid.test(client || '') || !secret) throw new Error('The stored tenant ID, client ID, or client secret is missing or invalid. Ask IT to confirm the credentials.');
  const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: client, client_secret: secret, scope: `${origin}/.default` })
  });
  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenData.access_token) {
    const messages = { invalid_client: 'Microsoft rejected the application credentials. Ask IT to check the client secret value, expiry, and client ID.', invalid_scope: 'Microsoft rejected the environment scope. Ask IT to confirm the environment address.', unauthorized_client: 'Microsoft has not authorised this application. Ask IT to confirm the tenant and application configuration.' };
    throw new Error(messages[tokenData.error] || 'Microsoft authentication failed. Ask IT to confirm the application configuration.');
  }
  const response = await fetch(`${origin}/api/data/v9.2/WhoAmI`, {
    redirect: 'error', signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/json', 'OData-MaxVersion': '4.0', 'OData-Version': '4.0' }
  });
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'Dataverse denied application access. Ask IT to create or enable the application user in this environment and assign its security role.' : `Dataverse connection check failed (HTTP ${response.status}). Ask IT to confirm the environment address and availability.`);
  const identity = await response.json();
  if (!guid.test(identity.OrganizationId || '') || !guid.test(identity.UserId || '')) throw new Error('Dataverse did not return a valid application identity.');
  return { organisation_id: identity.OrganizationId, application_user_id: identity.UserId };
}