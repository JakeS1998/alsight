import { flowSpecs } from './dataverseFlowFields.ts';
import { sharedFlowContext } from './dataverseFlowApi.ts';
import { withDataversePollLease } from './dataversePollLease.ts';
import { pollFlowBatch } from './dataversePollBatch.ts';
export async function pollDataverse(base44, config, input) {
  const configured = ['users', 'accounts', 'projects', 'contacts', 'documents', 'dma', 'jct', 'warranties', 'insurance', 'coms'].filter(table => config?.tables?.[table]?.mappings?.length);
  if (input.preview === true) {
    const samples = [], context = configured.length ? await sharedFlowContext(base44, config) : null;
    for (const table of configured) samples.push(await pollFlowBatch(base44, context, table, config.tables[table], {}, true));
    return { interval_minutes: 15, tables: configured, batch_size: 50, changed_records_only_after_initial_scan: true, samples, configured: Boolean(config?.source_connection_id) };
  }
  if (input.begin !== true && ([input.cycle_token, input.dispatch_token].some(token => typeof token !== 'string' || !/^[0-9a-f-]{36}$/i.test(token)))) throw new Error('Invalid automatic sync continuation.');
  return await withDataversePollLease(base44, async state => {
    const db = base44.entities.DataversePollState;
    try {
      let cycle = state.cycle_token, remaining = state.remaining_tables || [];
      if (input.begin === true) {
        if (state.status === 'running' && Date.parse(state.last_activity) > Date.now() - 360000) return { continue: false, skipped: 'The previous automatic pass is still running.' };
        if (!config?.source_connection_id) throw new Error('Confirm Jake’s shared Dataverse account before automatic checks can run.');
        cycle = crypto.randomUUID(); remaining = configured;
        await db.update(state.id, { cycle_token: cycle, remaining_tables: remaining, status: 'running', error: '', last_activity: new Date().toISOString() });
      } else if (cycle !== input.cycle_token || state.dispatch_token !== input.dispatch_token || state.status !== 'running') return { continue: false, skipped: 'This automatic continuation has already been consumed.' };
      const table = remaining[0], settings = config?.tables?.[table];
      let tables = state.tables || {}, checkpoint;
      if (table && settings?.mappings?.length) {
        const context = await sharedFlowContext(base44, config);
        checkpoint = await pollFlowBatch(base44, context, table, settings, tables[table]);
        tables = { ...tables, [table]: checkpoint };
      }
      if (!checkpoint?.cursor) remaining = remaining.slice(1);
      const completed = !remaining.length, now = new Date().toISOString();
      await db.update(state.id, { tables, remaining_tables: remaining, dispatch_token: completed ? '' : crypto.randomUUID(), last_activity: now, error: '', status: completed ? 'completed' : 'running', ...(completed ? { last_completed_at: now } : {}) });
      return { continue: !completed, cycle_token: cycle, table: table || null, processed: checkpoint?.processed || 0, counts: checkpoint?.last_batch || {} };
    } catch (error) {
      await db.update(state.id, { status: 'error', error: String(error.message || 'Automatic Dataverse sync failed.').slice(0, 1000), last_activity: new Date().toISOString() });
      throw error;
    }
  });
}