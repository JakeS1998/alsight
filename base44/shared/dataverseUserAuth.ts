import { secrets } from 'base44:runtime';
import { dataverseEnvironment } from './dataverseConnection.ts';
import { dataverseRequest } from './dataverseRequest.ts';

export const dataverseRedirectUri = 'https://alsight.base44.app/dataverse-callback';
export const dataverseRoles = ['admin', 'director', 'regional_director', 'bsm', 'bdm', 'finance'];
const base64url = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const decode = value => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const text = new TextEncoder();
function credentials() {
  const tenant = secrets.get('DATAVERSE_TENANT_ID')?.trim(), client = secrets.get('DATAVERSE_CLIENT_ID')?.trim(), secret = secrets.get('DATAVERSE_CLIENT_SECRET');
  const guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!guid.test(tenant || '') || !guid.test(client || '') || !secret) throw new Error('Ask IT to confirm the stored Dataverse tenant, client ID and client secret.');
  return { tenant, client, secret };
}
async function encryptionKey() {
  const { secret } = credentials();
  const digest = await crypto.subtle.digest('SHA-256', text.encode(`ALSight:DataverseUser:v1:${secret}`));
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
async function encrypt(value, userId, environment) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: text.encode(`${userId}|${environment}`) }, await encryptionKey(), text.encode(JSON.stringify(value)));
  return `${base64url(iv)}.${base64url(new Uint8Array(encrypted))}`;
}
async function decrypt(record, userId) {
  if (record.user_id !== userId) throw new Error('This connection belongs to another user.');
  const [iv, data] = (record.encrypted_payload || '').split('.');
  try {
    const result = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(iv), additionalData: text.encode(`${userId}|${record.environment_url}`) }, await encryptionKey(), decode(data));
    return JSON.parse(new TextDecoder().decode(result));
  } catch { throw new Error('Connect your Dataverse account again.'); }
}
export async function personalDataverseContext(base44, user) {
  if (!dataverseRoles.includes(user.role)) throw new Error('Dataverse access is available to internal staff only.');
  const config = await base44.asServiceRole.entities.DataverseConnection.filter({ key: 'primary' }, { limit: 1 });
  if (!config.items[0]) throw new Error('An administrator must save the Dataverse environment address first.');
  const environment = dataverseEnvironment(config.items[0].environment_url);
  const page = await base44.asServiceRole.entities.DataverseUserConnection.filter({ user_id: user.id, environment_url: environment }, { limit: 1 });
  return { environment, record: page.items[0] || null };
}
export function personalDataverseSummary(environment, record) {
  return { environment_url: environment, connected: record?.status === 'connected', organisation_id: record?.organisation_id || '', dataverse_user_id: record?.dataverse_user_id || '', last_checked_at: record?.last_checked_at || null };
}
async function savePayload(base44, user, environment, record, payload, values) {
  const data = { user_id: user.id, environment_url: environment, encrypted_payload: await encrypt(payload, user.id, environment), ...values };
  return record ? await base44.asServiceRole.entities.DataverseUserConnection.update(record.id, data) : await base44.asServiceRole.entities.DataverseUserConnection.create(data);
}
async function tokenRequest(environment, parameters) {
  const { tenant, client, secret } = credentials();
  const response = await dataverseRequest('Microsoft authentication', `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: client, client_secret: secret, scope: `${environment}/user_impersonation offline_access`, ...parameters }).toString()
  }, [secret, parameters.code, parameters.refresh_token]);
  const data = await response.json();
  if (!response.ok || !data.access_token) {
    const messages = { invalid_client: 'Microsoft rejected the application credentials. Ask IT to confirm the client secret.', invalid_grant: 'Microsoft sign-in has expired or was revoked. Connect your Dataverse account again.', invalid_scope: 'Ask IT to enable the Dynamics CRM delegated user_impersonation permission.', unauthorized_client: 'Ask IT to configure this application for delegated Microsoft sign-in.', interaction_required: 'Microsoft requires a fresh sign-in. Connect your Dataverse account again.' };
    throw new Error(messages[data.error] || 'Microsoft could not complete sign-in. Ask IT to check delegated permissions, consent and the registered return address.');
  }
  return { access_token: data.access_token, refresh_token: data.refresh_token || parameters.refresh_token || '', expires_at: Date.now() + Number(data.expires_in || 3600) * 1000 };
}
export async function delegatedDataverseIdentity(environment, accessToken) {
  const response = await dataverseRequest('Dataverse identity check', `${environment}/api/data/v9.2/WhoAmI`, {
    redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'OData-MaxVersion': '4.0', 'OData-Version': '4.0' }
  }, [accessToken]);
  if (!response.ok) throw new Error([401, 403].includes(response.status) ? 'Dataverse denied your user access. Ask IT to enable your user in this environment and assign the required licence and security roles.' : `Dataverse access check failed (HTTP ${response.status}).`);
  const identity = await response.json();
  const guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!guid.test(identity.OrganizationId || '') || !guid.test(identity.UserId || '')) throw new Error('Dataverse did not return a valid user identity.');
  return { organisation_id: identity.OrganizationId, dataverse_user_id: identity.UserId, last_checked_at: new Date().toISOString() };
}
export async function beginDataverseSignIn(base44, user, environment, record) {
  const { tenant, client } = credentials();
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const state = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', text.encode(verifier))));
  await savePayload(base44, user, environment, record, { verifier, state, expires_at: Date.now() + 10 * 60000 }, { status: 'pending', organisation_id: '', dataverse_user_id: '', last_checked_at: null });
  const params = new URLSearchParams({ client_id: client, response_type: 'code', redirect_uri: dataverseRedirectUri, response_mode: 'query', scope: `${environment}/user_impersonation offline_access`, state, code_challenge: challenge, code_challenge_method: 'S256', prompt: 'select_account' });
  return { authorization_url: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params}` };
}
export async function finishDataverseSignIn(base44, user, environment, record, input) {
  if (!record || record.status !== 'pending') throw new Error('Start Dataverse sign-in again from Account Settings.');
  if (typeof input.state !== 'string' || input.state.length > 100 || typeof input.code !== 'string' || !input.code || input.code.length > 10000) throw new Error('Invalid Microsoft sign-in response.');
  const session = await decrypt(record, user.id);
  if (session.state !== input.state || session.expires_at < Date.now()) throw new Error('The sign-in request has expired or does not match your account. Start again.');
  // Consume the single-use request before exchanging the code.
  await base44.asServiceRole.entities.DataverseUserConnection.update(record.id, { status: 'disconnected', encrypted_payload: '' });
  const tokens = await tokenRequest(environment, { grant_type: 'authorization_code', code: input.code, code_verifier: session.verifier, redirect_uri: dataverseRedirectUri });
  const identity = await delegatedDataverseIdentity(environment, tokens.access_token);
  const saved = await savePayload(base44, user, environment, record, tokens, { status: 'connected', ...identity });
  return personalDataverseSummary(environment, saved);
}
export async function getPersonalDataverseToken(base44, user, environment, record) {
  if (!record || record.status !== 'connected') throw new Error('Connect your own Dataverse account in Account Settings first.');
  let tokens = await decrypt(record, user.id);
  if (tokens.expires_at <= Date.now() + 60000) {
    if (!tokens.refresh_token) throw new Error('Connect your Dataverse account again.');
    tokens = await tokenRequest(environment, { grant_type: 'refresh_token', refresh_token: tokens.refresh_token });
    await savePayload(base44, user, environment, record, tokens, { status: 'connected' });
  }
  return tokens.access_token;
}
export async function checkPersonalDataverse(base44, user) {
  const { environment, record } = await personalDataverseContext(base44, user);
  const accessToken = await getPersonalDataverseToken(base44, user, environment, record);
  const identity = await delegatedDataverseIdentity(environment, accessToken);
  const saved = await base44.asServiceRole.entities.DataverseUserConnection.update(record.id, identity);
  return personalDataverseSummary(environment, saved);
}