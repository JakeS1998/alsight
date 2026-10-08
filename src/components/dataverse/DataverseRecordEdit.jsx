import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import FlowRecordEditor from '@/components/dataverse/FlowRecordEditor';
import flowRequest from '@/components/dataverse/flowClient';
const entities = { projects: 'Project', accounts: 'Account', contacts: 'Contact', documents: 'LegalDocument', dma: 'DMA', jct: 'JCT', warranties: 'Warranty' };
export default function DataverseRecordEdit({ table, record, onUpdated }) {
  const { user } = useAuth();
  const allowed = ['admin', 'director', 'regional_director', 'bsm', 'bdm', 'finance'].includes(user?.role);
  const linked = Boolean(record?.id && record?.dataverse_id);
  const status = useQuery({ queryKey: ['dataverse-write-access', user?.id, user?.role], queryFn: () => flowRequest('status'), enabled: allowed && linked, staleTime: 300000, retry: false });
  if (!allowed || !linked) return null;
  if (status.isPending) return <p role="status" className="text-xs text-muted-foreground">Checking editable fields…</p>;
  if (status.isError) return <div className="space-y-1 text-xs"><p role="alert" className="text-destructive">Unable to load editing permissions.</p><Button type="button" variant="outline" size="sm" onClick={() => status.refetch()}>Retry edit access</Button></div>;
  const data = status.data, option = data.tables?.[table] || { enabled: data.config?.tables?.[table]?.mappings?.some(m => m.write), canWrite: data.specs?.[table]?.writeRoles?.includes(user?.role) };
  if (!option.enabled || !option.canWrite) return null;
  const saved = async data => { if (!data.refreshRequired && onUpdated) onUpdated(await base44.entities[entities[table]].get(record.id)); };
  return <FlowRecordEditor key={`${table}-${record.id}`} table={table} recordId={record.id} writableOnly onSaved={saved} />;
}