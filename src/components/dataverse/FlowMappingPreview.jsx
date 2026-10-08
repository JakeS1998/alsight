import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import useFlowOperation from '@/components/dataverse/useFlowOperation';
export default function FlowMappingPreview({ table }) {
  const { run, busy, error } = useFlowOperation(), [records, setRecords] = useState(null);
  const load = async () => { const data = await run('preview', { table }); if (data) setRecords(data.records); };
  return <div className="space-y-3"><Button variant="outline" disabled={Boolean(busy)} onClick={load}>{busy ? 'Loading preview…' : 'Preview three mapped records'}</Button>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{records && (records.length ? <div className="grid gap-3 md:grid-cols-3">{records.map((record, index) => <dl key={index} className="space-y-2 rounded-lg border border-border bg-muted p-3 text-xs">{Object.entries(record).map(([name, value]) => <div key={name}><dt className="font-medium capitalize">{name.replaceAll('_', ' ')}</dt><dd className="break-words text-muted-foreground">{value === null ? 'Not set' : String(value)}</dd></div>)}</dl>)}</div> : <p className="text-sm text-muted-foreground">No Dataverse records to preview.</p>)}</div>;
}