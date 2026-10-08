import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import FlowColumnSetup from '@/components/dataverse/FlowColumnSetup';
import FlowMappingPreview from '@/components/dataverse/FlowMappingPreview';
import useFlowOperation from '@/components/dataverse/useFlowOperation';
import FlowReviewQueue from '@/components/dataverse/FlowReviewQueue';
import FlowMappingCoverage from '@/components/dataverse/FlowMappingCoverage';
import { matchFlowChoices } from '@/components/dataverse/flowMappingTypes';
export default function FlowTableMapping({ table, spec, settings, onUpdated }) {
  const { run, busy, error, notice } = useFlowOperation();
  const queryClient = useQueryClient();
  const [candidates, setCandidates] = useState([]), [logicalName, setLogicalName] = useState(settings?.logicalName || '');
  const [metadata, setMetadata] = useState(null), [mappings, setMappings] = useState(settings?.mappings || []);
  const [columnPlans, setColumnPlans] = useState(settings?.columnPlans || {});
  useEffect(() => { setMappings(settings?.mappings || []); setColumnPlans(settings?.columnPlans || {}); }, [settings?.mappings, settings?.columnPlans]);
  const dirty = JSON.stringify(mappings) !== JSON.stringify(settings?.mappings || []) || JSON.stringify(columnPlans) !== JSON.stringify(settings?.columnPlans || {});
  const discover = async () => { const data = await run('discover', { table }); if (data) { setCandidates(data.tables); if (data.tables.length === 1) setLogicalName(data.tables[0].LogicalName); } };
  const inspect = async () => { const data = await run('inspect', { table, logicalName }); if (data) { setMetadata(data); setMappings(current => (logicalName !== settings?.logicalName ? data.suggestions || [] : current).map(mapping => { const source = data.fields.find(field => field.name === mapping.source); return ['Picklist', 'State', 'Status'].includes(source?.type) ? { ...mapping, values: matchFlowChoices(source.options, spec.enums?.[mapping.local], mapping.values) } : mapping; })); } };
  const save = async () => { const data = await run('mapping', { table, logicalName: metadata?.logicalName || settings?.logicalName, mappings, columnPlans }); if (data) onUpdated(); };
  const sync = async restart => { const data = await run('sync', { table, restart }); if (data) { queryClient.invalidateQueries(); onUpdated(); } };
  return <section className="space-y-4 rounded-panel border border-border bg-card p-5">
    <header><h3 className="font-heading text-lg font-semibold">{spec.label || table}</h3><p className="text-sm text-muted-foreground">{settings?.entitySet || spec.sourceNames?.[0]} → {spec.entity}. {table === 'users' ? 'Exact-email matches only. No new logins or role changes.' : 'New rows are added automatically using their Dataverse GUID. Project lookups link ownership, client access and documents.'}</p></header>
    <FlowMappingCoverage spec={spec} mappings={mappings} columnPlans={columnPlans} dirty={dirty} />
    <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={Boolean(busy)} onClick={discover}>Discover table</Button>{candidates.length > 0 && <><select aria-label="Dataverse table" className="min-w-0 rounded-md border border-input bg-card px-2 text-sm" disabled={Boolean(busy)} value={logicalName} onChange={e => { setLogicalName(e.target.value); setMetadata(null); }}><option value="">Choose table</option>{candidates.map(t => <option key={t.LogicalName} value={t.LogicalName}>{t.LogicalName} ({t.EntitySetName})</option>)}</select><Button variant="outline" disabled={Boolean(busy) || !logicalName} onClick={inspect}>Inspect fields</Button></>}</div>
    <FlowColumnSetup table={table} spec={spec} settings={settings} metadata={metadata} mappings={mappings} setMappings={setMappings} columnPlans={columnPlans} setColumnPlans={setColumnPlans} busy={busy} logicalName={logicalName} inspect={inspect} save={save} dirty={dirty} />
    {spec.sourceNote && <p className="rounded-md border border-border bg-muted p-3 text-xs text-muted-foreground">{spec.sourceNote}</p>}
    {settings && <div className="space-y-2 border-t border-border pt-3"><p className="text-sm">Confirmed: {settings.logicalName} · {settings.mappings.length} fields</p><p className="text-xs text-muted-foreground">{settings.processed || 0} source records scanned · {settings.updated || 0} linked records updated · {settings.queued || 0} queued during this pass. {settings.complete ? 'Pass complete.' : settings.cursor ? 'More records available.' : 'Not yet synchronised.'}{settings.last_synced_at && ` Last batch: ${new Date(settings.last_synced_at).toLocaleString()}`}</p><div className="flex flex-wrap gap-2"><Button disabled={Boolean(busy) || dirty} onClick={() => sync(true)}>Start sync / refresh</Button>{settings.cursor && <Button variant="outline" disabled={Boolean(busy) || dirty} onClick={() => sync(false)}>Sync next 50 records</Button>}</div><p className="text-xs text-muted-foreground">Mapped blank values clear ALSight fields. New non-user records import automatically by GUID without approval; existing placeholders are not overwritten by name matches. Only invalid or conflicting data needs attention. No records are deleted; unmapped fields remain unchanged.</p></div>}
    {settings && <FlowMappingPreview table={table} />}
    {settings?.mappings?.length > 0 && <FlowReviewQueue table={table} refreshKey={`${settings.revision || 'legacy'}:${settings.last_synced_at || ''}`} />}
    {busy && <p role="status" className="text-sm text-muted-foreground">Working…</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{notice && <p role="status" className="text-sm text-success">{notice}</p>}
  </section>;
}