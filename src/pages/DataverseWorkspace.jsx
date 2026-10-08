import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import DataverseConnectionCard from '@/components/dataverse/DataverseConnectionCard';
import FlowRecordPicker from '@/components/dataverse/FlowRecordPicker';
import FlowRecordEditor from '@/components/dataverse/FlowRecordEditor';
import useFlowOperation from '@/components/dataverse/useFlowOperation';
export default function DataverseWorkspace() {
  const { run, busy, error } = useFlowOperation(), [data, setData] = useState(null), [table, setTable] = useState('projects'), [recordId, setRecordId] = useState('');
  const { user } = useAuth(), allowed = ['admin', 'director', 'regional_director', 'bsm', 'bdm', 'finance'].includes(user?.role);
  useEffect(() => { if (allowed) run('status').then(result => { if (result) setData(result); }); }, [allowed]);
  if (!allowed) return <Navigate to="/account-settings" replace />;
  const options = data?.tables || Object.fromEntries(Object.entries(data?.specs || {}).map(([key]) => [key, { enabled: data.config?.tables?.[key]?.mappings?.some(m => m.write), canWrite: true }]));
  return <div className="space-y-5"><header><h1 className="font-heading text-2xl font-semibold">Dataverse write-back</h1><p className="text-sm text-muted-foreground">Review and update mapped ALSight records using your own Microsoft account.</p></header><DataverseConnectionCard />
    <div className="flex flex-wrap gap-2">{['projects', 'contacts', 'documents'].map(key => <Button key={key} variant={table === key ? 'default' : 'outline'} onClick={() => { setTable(key); setRecordId(''); }}>{key === 'projects' ? 'Projects' : key === 'documents' ? 'Documents' : 'Contacts'}</Button>)}<Button variant="outline" asChild><Link to="/account-settings">Account settings</Link></Button></div>
    {busy && <p role="status">Loading data flow…</p>}{error && <div className="space-y-2"><p role="alert" className="text-destructive">{error}</p><Button variant="outline" disabled={Boolean(busy)} onClick={async () => { const result = await run('status'); if (result) setData(result); }}>Reload data flow</Button></div>}
    {data && (!options[table]?.canWrite ? <p className="rounded-panel border border-border bg-card p-5 text-sm">Your ALSight role does not allow edits to this table.</p> : !options[table]?.enabled ? <p className="rounded-panel border border-border bg-card p-5 text-sm">An administrator must confirm the mapped write-back fields for this table first.</p> : <div className="grid items-start gap-5 lg:grid-cols-[minmax(260px,1fr)_2fr]"><FlowRecordPicker table={table} selected={recordId} onSelect={setRecordId} />{recordId ? <FlowRecordEditor key={`${table}-${recordId}`} table={table} recordId={recordId} /> : <p className="rounded-panel border border-border bg-card p-5 text-sm text-muted-foreground">Choose a linked ALSight record to load its latest Dataverse values.</p>}</div>)}
  </div>;
}