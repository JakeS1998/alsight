import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import FlowFieldInput from '@/components/dataverse/FlowFieldInput';
import useFlowOperation from '@/components/dataverse/useFlowOperation';
import { useQueryClient } from '@tanstack/react-query';
export default function FlowRecordEditor({ table, recordId }) {
  const { run, busy, error, notice } = useFlowOperation(), [record, setRecord] = useState(null), [values, setValues] = useState({});
  const queryClient = useQueryClient();
  const reload = async () => { const data = await run('load', { table, recordId }); if (data) { setRecord(data); setValues(data.values); } };
  useEffect(() => { setRecord(null); reload(); }, [table, recordId]);
  const changes = record ? Object.fromEntries(record.fields.filter(f => f.write && values[f.local] !== record.values[f.local]).map(f => [f.local, values[f.local]])) : {};
  const save = async e => { e.preventDefault(); const data = await run('save', { table, recordId, etag: record.etag, values: changes }); if (data) { setRecord(data.refreshRequired ? null : data); setValues(data.values || {}); queryClient.invalidateQueries(); } };
  return <form onSubmit={save} className="space-y-4 rounded-panel border border-border bg-card p-5">
    <header><h2 className="text-lg font-semibold">{record?.title || 'Dataverse record'}</h2><p className="text-sm text-muted-foreground">Loaded directly using your account. Changes are saved as your Dataverse identity.</p></header>
    {record && <div className="grid gap-4 md:grid-cols-2">{record.fields.map(field => <FlowFieldInput key={field.local} field={field} value={values[field.local]} disabled={Boolean(busy)} onChange={value => setValues(old => ({ ...old, [field.local]: value }))} />)}</div>}
    <div className="flex flex-wrap gap-2">{record && <Button type="submit" disabled={Boolean(busy) || !Object.keys(changes).length}>Save to Dataverse</Button>}<Button type="button" variant="outline" disabled={Boolean(busy)} onClick={reload}>Reload latest record</Button></div>
    {busy && <p role="status" className="text-sm text-muted-foreground">{busy === 'save' ? 'Saving under your Dataverse account…' : 'Loading latest Dataverse record…'}</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{notice && <p role="status" className="text-sm text-success">{notice}</p>}
  </form>;
}