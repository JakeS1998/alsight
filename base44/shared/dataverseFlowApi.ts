import { dataverseRequest } from './dataverseRequest.ts';
import { personalDataverseContext, getPersonalDataverseToken, delegatedDataverseIdentity } from './dataverseUserAuth.ts';
export async function flowConfig(base44) {
  return (await base44.asServiceRole.entities.DataverseFlowConfig.filter({ key: 'primary' }, { limit: 1 })).items[0] || null;
}
export async function flowRequest(environment, token, path, options = {}) {
  const url = new URL(path, `${environment}/api/data/v9.2/`);
  if (url.origin !== environment || !url.pathname.startsWith('/api/data/v9.2/')) throw new Error('Invalid Dataverse request address.');
  const response = await dataverseRequest('Dataverse data flow', url.href, { redirect: 'manual', signal: AbortSignal.timeout(20000), ...options, headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'OData-MaxVersion': '4.0', 'OData-Version': '4.0', 'Content-Type': 'application/json', ...options.headers } }, [token]);
  if (!response.ok) {
    const code = response.status === 412 ? 'conflict' : [401, 403].includes(response.status) ? 'access' : 'dataverse';
    let message = response.status === 412 ? 'This record changed in Dataverse. Reload it and review your changes before saving again.' : response.status === 401 ? 'Your Microsoft session has expired. Reconnect the relevant Dataverse account.' : response.status === 403 ? 'Dataverse refused this operation. Check the connected account’s record and field permissions.' : response.status === 429 ? 'Dataverse is busy. Wait a moment before trying again.' : response.status === 404 ? 'Dataverse could not find this table or record. Review the table mapping.' : `Dataverse could not complete the operation (HTTP ${response.status}).`;
    if (response.status === 400) {
      const details = await response.json().catch(() => null);
      const detail = details?.error?.message;
      if (typeof detail === 'string') message = `Dataverse rejected the values: ${detail.split(token).join('[redacted]').slice(0, 300)}`;
    }
    const error = new Error(message); error.code = code; error.status = response.status; throw error;
  }
  return response.status === 204 ? null : await response.json();
}
export async function sharedFlowContext(base44, config) {
  if (!config?.source_connection_id) throw new Error('An administrator must confirm Jake’s shared read connection first.');
  const primary = (await base44.asServiceRole.entities.DataverseConnection.filter({ key: 'primary' }, { limit: 1 })).items[0];
  if (primary?.environment_url !== config.environment_url) throw new Error('The environment changed. Confirm Jake’s connection and mappings again.');
  const record = await base44.asServiceRole.entities.DataverseUserConnection.get(config.source_connection_id);
  if (record?.user_id !== config.source_user_id || record.environment_url !== config.environment_url) throw new Error('Jake’s shared connection is unavailable. Confirm it again.');
  const token = await getPersonalDataverseToken(base44, { id: config.source_user_id }, config.environment_url, record);
  return { environment: config.environment_url, token, record };
}
export async function confirmJake(base44, user) {
  const users = await base44.entities.User.filter({ email: 'jake@allianceleisure.co.uk' });
  const owner = users.find(candidate => candidate.role === 'admin') || user;
  const context = await personalDataverseContext(base44, owner);
  const { environment, record } = context;
  const token = await getPersonalDataverseToken(base44, owner, environment, record);
  const identity = await delegatedDataverseIdentity(environment, token);
  const account = await flowRequest(environment, token, `systemusers(${identity.dataverse_user_id})?$select=internalemailaddress,isdisabled`);
  if (account.isdisabled || account.internalemailaddress?.toLowerCase() !== 'jake@allianceleisure.co.uk') throw new Error('Connect Jake’s work Dataverse account in Account Settings, then confirm it here.');
  await base44.asServiceRole.entities.DataverseUserConnection.update(record.id, identity);
  return { environment_url: environment, source_connection_id: record.id, source_user_id: owner.id, source_email: account.internalemailaddress, last_checked_at: identity.last_checked_at };
}