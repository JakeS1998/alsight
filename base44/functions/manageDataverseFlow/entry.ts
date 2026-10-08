import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { dataverseRoles } from '../../shared/dataverseUserAuth.ts';
import { flowConfig, sharedFlowContext, confirmJake } from '../../shared/dataverseFlowApi.ts';
import { flowSpecs } from '../../shared/dataverseFlowFields.ts';
import { discoverFlowTables, inspectFlowTable, validateMapping } from '../../shared/dataverseFlowMetadata.ts';
import { syncFlowBatch } from '../../shared/dataverseFlowSync.ts';
import { writeFlowContext, loadFlowRecord, saveFlowRecord } from '../../shared/dataverseFlowWrite.ts';
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req), user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in to continue.' }, { status: 401 });
    if (!dataverseRoles.includes(user.role)) return Response.json({ error: 'Internal staff only.' }, { status: 403 });
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405 });
    const raw = await req.text();
    if (raw.length > 40000) return Response.json({ error: 'Request too large.' }, { status: 400 });
    const input = JSON.parse(raw), adminActions = ['confirmJake', 'checkShared', 'discover', 'inspect', 'mapping', 'sync'];
    if (!['status', 'load', 'save', ...adminActions].includes(input.action)) return Response.json({ error: 'Invalid operation.' }, { status: 400 });
    if (adminActions.includes(input.action) && user.role !== 'admin') return Response.json({ error: 'Administrator access required.' }, { status: 403 });
    let config = await flowConfig(base44);
    if (input.action === 'status') return Response.json({ configured: Boolean(config?.source_connection_id), ...(user.role === 'admin' ? { config, specs: flowSpecs } : { tables: Object.fromEntries(Object.entries(flowSpecs).map(([key, spec]) => [key, { enabled: Boolean(config?.tables?.[key]?.mappings?.some(m => m.write)), canWrite: spec.writeRoles.includes(user.role) }])) }) });
    if (input.action === 'confirmJake') {
      const values = await confirmJake(base44, user);
      const data = { key: 'primary', ...values, tables: config?.environment_url === values.environment_url ? config.tables || {} : {} };
      config = config ? await base44.asServiceRole.entities.DataverseFlowConfig.update(config.id, data) : await base44.asServiceRole.entities.DataverseFlowConfig.create(data);
      return Response.json({ config, notice: 'Jake’s account is confirmed for shared reads only.' });
    }
    if (input.action === 'checkShared') {
      const context = await sharedFlowContext(base44, config);
      await flowRequestCheck(context);
      await base44.asServiceRole.entities.DataverseFlowConfig.update(config.id, { last_checked_at: new Date().toISOString() });
      return Response.json({ notice: 'Jake’s shared read connection is available.' });
    }
    if (!flowSpecs[input.table]) return Response.json({ error: 'Choose projects or contacts.' }, { status: 400 });
    if (['load', 'save'].includes(input.action)) {
      const context = await writeFlowContext(base44, user, config, input);
      return Response.json(input.action === 'load' ? await loadFlowRecord(context) : await saveFlowRecord(base44, context, input));
    }
    const context = await sharedFlowContext(base44, config);
    if (input.action === 'discover') return Response.json({ tables: await discoverFlowTables(context, input.table) });
    if (input.action === 'inspect') return Response.json(await inspectFlowTable(context, input.table, input.logicalName));
    if (input.action === 'mapping') {
      const inspected = await inspectFlowTable(context, input.table, input.logicalName);
      const mappings = validateMapping(input.table, inspected, input.mappings);
      const { fields, ...meta } = inspected;
      const tables = { ...config.tables, [input.table]: { ...meta, mappings, cursor: '', processed: 0, complete: false } };
      await base44.asServiceRole.entities.DataverseFlowConfig.update(config.id, { tables });
      return Response.json({ tables, notice: 'Mapping confirmed against live Dataverse metadata.' });
    }
    return Response.json(await syncFlowBatch(base44, context, input.table, config, input.restart === true));
  } catch (error) { return Response.json({ error: error.message || 'Unable to complete Dataverse data flow.', code: error.code || 'flow' }, { status: error.status === 403 ? 403 : error.status === 412 ? 409 : 400 }); }
}
async function flowRequestCheck(context) {
  const { delegatedDataverseIdentity } = await import('../../shared/dataverseUserAuth.ts');
  await delegatedDataverseIdentity(context.environment, context.token);
}