import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import FlowMappingRows from '@/components/dataverse/FlowMappingRows';
import FlowMappingPreview from '@/components/dataverse/FlowMappingPreview';
import useFlowOperation from '@/components/dataverse/useFlowOperation';
export default function FlowTableMapping({ table, spec, settings, onUpdated }) {
  const { run, busy, error, notice } = useFlowOperation();
  const queryClient = useQueryClient();
  const [candidates, setCandidates] = useState([]), [logicalName, setLogicalName] = useState(settings?.logicalName || '');
  const [metadata, setMetadata] = useState(null), [mappings, setMappings] = useState(settings?.mappings || []);
  const discover = async () => { const data = await run('discover', { table }); if (data) { setCandidates(data.tables); if (data.tables.length === 1) setLogicalName(data.tables[0].LogicalName); } };
  const inspect = async () => { const data = await run('inspect', { table, logicalName }); if (data) { setMetadata(data); if (logicalName !== settings?.logicalName) setMappings([]); } };
  const save = async () => { const data = await run('mapping', { table, logicalName: metadata.logicalName, mappings }); if (data) onUpdated(); };
  const sync = async restart => { const data = await run('sync', { table, restart }); if (data) { queryClient.invalidateQueries(); onUpdated(); } };
  return <section className="space-y-4 rounded-panel border border-border bg-card p-5">
    <header><h3 className="font-heading text-lg font-semibold capitalize">{table}</h3><p className="text-sm text-muted-foreground">{table === 'projects' ? 'bss_projects' : 'contact'} → {spec.entity}. Existing ALSight edit permissions remain unchanged.</p></header>
    <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={Boolean(busy)} onClick={discover}>Discover table</Button>{candidates.length > 0 && <><select aria-label="Dataverse table" className="min-w-0 rounded-md border border-input bg-card px-2 text-sm" disabled={Boolean(busy)} value={logicalName} onChange={e => { setLogicalName(e.target.value); setMetadata(null); }}><option value="">Choose table</option>{candidates.map(t => <option key={t.LogicalName} value={t.LogicalName}>{t.LogicalName} ({t.EntitySetName})</option>)}</select><Button variant="outline" disabled={Boolean(busy) || !logicalName} onClick={inspect}>Inspect fields</Button></>}</div>
    {metadata && <><p className="text-xs text-muted-foreground">Live metadata: {metadata.logicalName} · Map {spec.required.replaceAll('_', ' ')} before syncing.</p><FlowMappingRows fields={spec.fields} sourceFields={metadata.fields} mappings={mappings} onChange={setMappings} disabled={Boolean(busy)} /><Button disabled={Boolean(busy)} onClick={save}>Confirm mapping</Button></>}
    {settings && <div className="space-y-2 border-t border-border pt-3"><p className="text-sm">Confirmed: {settings.logicalName} · {settings.mappings.length} fields</p><p className="text-xs text-muted-foreground">{settings.processed || 0} records processed in this pass. {settings.complete ? 'Pass complete.' : settings.cursor ? 'More records available.' : 'Not yet synchronised.'}{settings.last_synced_at && ` Last batch: ${new Date(settings.last_synced_at).toLocaleString()}`}</p><div className="flex flex-wrap gap-2"><Button disabled={Boolean(busy)} onClick={() => sync(true)}>Start sync / refresh</Button>{settings.cursor && <Button variant="outline" disabled={Boolean(busy)} onClick={() => sync(false)}>Sync next 50 records</Button>}</div><p className="text-xs text-muted-foreground">Updates mapped fields and adds missing records. Does not delete records or overwrite unmapped fields.</p></div>}
    {settings && <FlowMappingPreview table={table} />}
    {busy && <p role="status" className="text-sm text-muted-foreground">Working…</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{notice && <p role="status" className="text-sm text-success">{notice}</p>}
  </section>;
}