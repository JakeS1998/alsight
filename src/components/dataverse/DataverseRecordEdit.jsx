import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import DataverseEditContext from '@/components/dataverse/DataverseEditContext';
import flowRequest from '@/components/dataverse/flowClient';
const entities = { projects: 'Project', accounts: 'Account', contacts: 'Contact', documents: 'LegalDocument', dma: 'DMA', jct: 'JCT', warranties: 'Warranty' };
export default function DataverseRecordEdit({ table, record, onUpdated, children }) {
  const { user } = useAuth();
  const allowed = ['admin', 'director', 'regional_director', 'bsm', 'bdm', 'finance'].includes(user?.role);
  const linked = Boolean(record?.id && record?.dataverse_id);
  const status = useQuery({ queryKey: ['dataverse-write-access', user?.id, user?.role], queryFn: () => flowRequest('status'), enabled: allowed && linked && Boolean(children), staleTime: 300000, retry: false });
  const data = status.data;
  const option = data?.tables?.[table] || { enabled: data?.config?.tables?.[table]?.mappings?.some(m => m.write), canWrite: data?.specs?.[table]?.writeRoles?.includes(user?.role) };
  const mappedFields = allowed && linked && option.enabled && option.canWrite ? data?.writeFields?.[table] || data?.config?.tables?.[table]?.mappings?.filter(m => m.write).map(m => m.local) || [] : [];
  const saved = async () => { if (onUpdated) onUpdated(await base44.entities[entities[table]].get(record.id)); };
  return <DataverseEditContext.Provider value={{ table, record, saved, mappedFields, checking: allowed && linked && status.isPending }}>
    {children}
    {children && allowed && linked && status.isError && <div role="alert" className="text-xs text-destructive">Unable to check editable fields. <Button type="button" variant="link" size="sm" onClick={() => status.refetch()}>Retry</Button></div>}
  </DataverseEditContext.Provider>;
}