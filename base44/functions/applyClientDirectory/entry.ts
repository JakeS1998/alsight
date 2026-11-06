import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import clientDirectoryWorkbook from '../../shared/clientDirectoryWorkbook.ts';
import { flowConfig, flowRequest, sharedFlowContext } from '../../shared/dataverseFlowApi.ts';
import { loadFlowRecord } from '../../shared/dataverseFlowWrite.ts';
import { addFlowWriteValue } from '../../shared/dataverseWritePayload.ts';
import { flowSpecs, isGuid } from '../../shared/dataverseFlowFields.ts';
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(e => e.status === 401 ? null : Promise.reject(e));
    if (!user) return Response.json({ error: 'Sign in required.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Administrator access required.' }, { status: 403 });
    const { action = 'preview', offset = 0 } = await req.json().catch(() => ({}));
    if (!['preview','apply'].includes(action) || !Number.isInteger(offset) || offset < 0 || offset > 500) return Response.json({ error: 'Invalid operation.' }, { status: 400 });
    const rows = await clientDirectoryWorkbook(base44), config = await flowConfig(base44);
    // Explicitly authorised by the builder for this fixed workbook only; all other writes retain personal-account authentication.
    if (config?.source_email?.toLowerCase() !== 'jake@allianceleisure.co.uk') throw new Error('The confirmed shared connection is not Jake’s account.');
    const { environment, token } = await sharedFlowContext(base44, config);
    const regions = await flowRequest(environment, token, 'positions?$select=positionid,name&$top=500');
    if (regions['@odata.nextLink']) throw new Error('Region lookup requires additional pages.');
    const accounts = await base44.entities.Account.filter({ account_type: 'client', name: { $in: rows.map(row => row.client) } }, { limit: 500 });
    if (accounts.has_more) throw new Error('Too many matching accounts.');
    const plan = rows.map(row => {
      const matches = accounts.items.filter(account => account.name === row.client);
      const candidates = (regions.value || []).filter(region => region.name.replace(/\s*\([A-Z]{2,3}\)\s*$/, '').trim().toLowerCase() === row.region.toLowerCase());
      const values = {};
      if (row.full_name) values.full_name = row.full_name;
      if (row.region && row.region !== 'Review required' && candidates.length === 1) values.region = candidates[0].positionid;
      const issue = matches.length !== 1 ? `Client matches: ${matches.length}` : !isGuid(matches[0].dataverse_id) ? 'Client has no Dataverse link' : row.region && row.region !== 'Review required' && candidates.length !== 1 ? `Region matches: ${candidates.length}` : '';
      return { ...row, account: matches[0], values, issue };
    });
    if (action === 'preview') return Response.json({ total: rows.length, ready: plan.filter(row => !row.issue && Object.keys(row.values).length).length, regions: regions.value, exceptions: plan.filter(row => row.issue || row.region === 'Review required').map(({ client, region, issue, full_name }) => ({ client, region, issue, full_name })) });
    const settings = config.tables.accounts;
    if (!['region','full_name'].every(local => settings.mappings.some(m => m.local === local && m.write) && !settings.columnPlans?.[local])) throw new Error('Enable confirmed region and full-name write-back mappings first.');
    const results = [], localUpdates = [];
    for (const row of plan.slice(offset, offset + 25)) {
      if (row.issue || !Object.keys(row.values).length) { results.push({ client: row.client, status: 'skipped', reason: row.issue || 'Region requires review; no full name supplied' }); continue; }
      const context = { spec: flowSpecs.accounts, settings, record: row.account, sourceId: row.account.dataverse_id, environment, token };
      const fresh = await loadFlowRecord(context);
      const payload = {};
      for (const [local, value] of Object.entries(row.values)) await addFlowWriteValue(context, settings.mappings.find(m => m.local === local && m.write), value, payload);
      await flowRequest(environment, token, `accounts(${row.account.dataverse_id})`, { method: 'PATCH', headers: { 'If-Match': fresh.etag }, body: JSON.stringify(payload) });
      const verified = await loadFlowRecord(context);
      if (!Object.entries(row.values).every(([key, value]) => verified.values[key] === value)) throw new Error(`Dataverse verification failed for ${row.client}.`);
      localUpdates.push({ id: row.account.id, ...Object.fromEntries(Object.keys(row.values).map(key => [key, verified.values[key]])) });
      results.push({ client: row.client, status: 'saved', fields: Object.keys(row.values) });
    }
    if (localUpdates.length) await base44.asServiceRole.entities.Account.bulkUpdate(localUpdates);
    return Response.json({ offset, nextOffset: offset + results.length, total: rows.length, results });
  } catch (error) { return Response.json({ error: error.message }, { status: 400 }); }
}