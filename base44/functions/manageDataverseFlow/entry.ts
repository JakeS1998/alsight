import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { dataverseRoles } from '../../shared/dataverseUserAuth.ts';
import { flowConfig, sharedFlowContext, confirmJake, flowRequest } from '../../shared/dataverseFlowApi.ts';
import { flowSpecs } from '../../shared/dataverseFlowFields.ts';
import { validateColumnPlans, sameFlowMapping } from '../../shared/dataverseColumnPlans.ts';
import { discoverFlowTables, inspectFlowTable, validateMapping } from '../../shared/dataverseFlowMetadata.ts';
import { syncFlowBatch } from '../../shared/dataverseFlowSync.ts';
import { pollDataverse } from '../../shared/dataversePollRun.ts';
import { cleanDataverseDMA } from '../../shared/dataverseDMACleanup.ts';
import { configureFlowRelationships, addFlowRelationships } from '../../shared/dataverseRelationshipMappings.ts';
import { writeFlowContext, loadFlowRecord, saveFlowRecord } from '../../shared/dataverseFlowWrite.ts';
import { flowSelection, mappedFlowValues } from '../../shared/dataverseFlowValues.ts';
import { listFlowReviews, decideFlowReview } from '../../shared/dataverseFlowReview.ts';
import { flowReviewDetails, searchReviewTargets } from '../../shared/dataverseFlowReviewReads.ts';
// Supplier commission tables are included in the shared read-only catalogue.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req), user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in to continue.' }, { status: 401 });
    if (!dataverseRoles.includes(user.role)) return Response.json({ error: 'Internal staff only.' }, { status: 403 });
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405 });
    const raw = await req.text();
    if (raw.length > 40000) return Response.json({ error: 'Request too large.' }, { status: 400 });
    const input = JSON.parse(raw), adminActions = ['confirmJake', 'checkShared', 'discover', 'inspect', 'mapping', 'preview', 'sync', 'poll', 'relationships', 'cleanDMA', 'reviews', 'reviewDetails', 'reviewTargets', 'decideReview'];
    if (!['status', 'load', 'save', ...adminActions].includes(input.action)) return Response.json({ error: 'Invalid operation.' }, { status: 400 });
    if (adminActions.includes(input.action) && user.role !== 'admin') return Response.json({ error: 'Administrator access required.' }, { status: 403 });
    let config = await flowConfig(base44);
    if (input.action === 'status') {
      const pollState = user.role === 'admin' ? (await base44.entities.DataversePollState.filter({ key: 'primary' }, { limit: 1, fields: ['status', 'last_activity', 'last_completed_at', 'error'] })).items[0] || null : null;
      return Response.json({ writeFields: Object.fromEntries(Object.entries(flowSpecs).map(([key, spec]) => [key, spec.writeRoles.includes(user.role) ? (config?.tables?.[key]?.mappings || []).filter(m => m.write).map(m => m.local) : []])), configured: Boolean(config?.source_connection_id), ...(user.role === 'admin' ? { config, specs: flowSpecs, pollState } : { tables: Object.fromEntries(Object.entries(flowSpecs).map(([key, spec]) => [key, { label: spec.label, enabled: Boolean(config?.tables?.[key]?.mappings?.some(m => m.write)), canWrite: spec.writeRoles.includes(user.role) }])) }) });
    }
    if (input.action === 'poll') return Response.json(await pollDataverse(base44, config, input));
    if (input.action === 'relationships') return Response.json(await configureFlowRelationships(base44, await sharedFlowContext(base44, config), config));
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
    if (!flowSpecs[input.table]) return Response.json({ error: 'Choose one of the configured sync tables.' }, { status: 400 });
    if (['load', 'save'].includes(input.action)) {
      const context = await writeFlowContext(base44, user, config, input);
      return Response.json(input.action === 'load' ? await loadFlowRecord(context) : await saveFlowRecord(base44, context, input));
    }
    const context = await sharedFlowContext(base44, config);
    if (input.action === 'cleanDMA') {
      if (input.table !== 'dma') throw new Error('This cleanup is restricted to DMA records.');
      return Response.json(await cleanDataverseDMA(base44, context, config, input.preview !== false));
    }
    if (['reviews', 'reviewDetails', 'reviewTargets', 'decideReview'].includes(input.action)) {
      const settings = config.tables?.[input.table];
      if (!settings?.mappings?.length) throw new Error('Confirm this table mapping first.');
      if (input.action === 'reviews') return Response.json(await listFlowReviews(base44, context, input.table, settings, input));
      if (input.action === 'reviewDetails') return Response.json(await flowReviewDetails(base44, context, input.table, settings, input));
      if (input.action === 'reviewTargets') return Response.json(await searchReviewTargets(base44, context, input.table, settings, input));
      return Response.json(await decideFlowReview(base44, user, context, input.table, settings, input));
    }
    if (input.action === 'discover') return Response.json({ tables: await discoverFlowTables(context, input.table) });
    if (input.action === 'inspect') return Response.json(await inspectFlowTable(context, input.table, input.logicalName));
    if (input.action === 'mapping') {
      const inspected = await inspectFlowTable(context, input.table, input.logicalName);
      const mappings = validateMapping(input.table, inspected, addFlowRelationships(input.table, { mappings: input.mappings }, inspected));
      const columnPlans = validateColumnPlans(input.table, mappings, input.columnPlans ?? config.tables?.[input.table]?.columnPlans ?? {});
      const { fields, suggestions, warning, ...meta } = inspected;
      const previous = config.tables?.[input.table];
      const sameMapping = sameFlowMapping(input.table, previous, mappings, inspected.logicalName);
      const progress = sameMapping ? previous : { revision: crypto.randomUUID(), cursor: '', processed: 0, updated: 0, queued: 0, complete: false };
      const tables = { ...config.tables, [input.table]: { ...progress, ...meta, ...(previous?.dataverseOnly ? { dataverseOnly: true } : {}), mappings, columnPlans, updated_at: new Date().toISOString() } };
      await base44.asServiceRole.entities.DataverseFlowConfig.update(config.id, { tables });
      return Response.json({ tables, notice: 'Mapping confirmed against live Dataverse metadata.' });
    }
    if (input.action === 'preview') {
      const settings = config.tables?.[input.table];
      if (!settings?.mappings?.length) throw new Error('Confirm a mapping first.');
      const select = flowSelection(settings, input.table);
      const data = await flowRequest(context.environment, context.token, `${settings.entitySet}?$select=${select}&$top=3`);
      return Response.json({ records: (data.value || []).map(row => mappedFlowValues(input.table, settings, row)) });
    }
    return Response.json(await syncFlowBatch(base44, context, input.table, config, input.restart === true));
  } catch (error) { return Response.json({ error: error.message || 'Unable to complete Dataverse data flow.', code: error.code || 'flow' }, { status: error.status === 403 ? 403 : error.status === 412 ? 409 : 400 }); }
}
async function flowRequestCheck(context) {
  const { delegatedDataverseIdentity } = await import('../../shared/dataverseUserAuth.ts');
  await delegatedDataverseIdentity(context.environment, context.token);
}