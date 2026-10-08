import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import FlowRecordEditor from '@/components/dataverse/FlowRecordEditor';
import flowRequest from '@/components/dataverse/flowClient';
const entities = { projects: 'Project', accounts: 'Account', contacts: 'Contact', documents: 'LegalDocument', dma: 'DMA', jct: 'JCT', warranties: 'Warranty' };
export default function DataverseRecordEdit({ table, record, onUpdated }) {
  const { user } = useAuth(), [open, setOpen] = useState(false);
  const allowed = ['admin', 'director', 'regional_director', 'bsm', 'bdm', 'finance'].includes(user?.role);
  const linked = Boolean(record?.id && record?.dataverse_id);
  const status = useQuery({ queryKey: ['dataverse-write-access', user?.id, user?.role], queryFn: () => flowRequest('status'), enabled: allowed && linked, staleTime: 300000, retry: false });
  if (!allowed || !linked) return null;
  if (status.isPending) return <Button type="button" variant="outline" size="sm" disabled>Checking edit access…</Button>;
  if (status.isError) return <div className="space-y-1 text-xs"><p role="alert" className="text-destructive">Unable to load editing permissions.</p><Button type="button" variant="outline" size="sm" onClick={() => status.refetch()}>Retry edit access</Button></div>;
  const data = status.data, option = data.tables?.[table] || { enabled: data.config?.tables?.[table]?.mappings?.some(m => m.write), canWrite: data.specs?.[table]?.writeRoles?.includes(user?.role) };
  if (!option.enabled || !option.canWrite) return null;
  const saved = async data => { if (!data.refreshRequired && onUpdated) onUpdated(await base44.entities[entities[table]].get(record.id)); };
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button type="button" variant="outline" size="sm"><Pencil className="h-4 w-4" />Edit write-back fields</Button></DialogTrigger>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto">
      <DialogHeader><DialogTitle>Edit {record.name || record.full_name || record.document_id || record.warranty_id || 'record'}</DialogTitle><DialogDescription>Only fields enabled for write-back are editable. Changes are saved using your own Dataverse account.</DialogDescription></DialogHeader>
      <Link to="/account-settings" className="text-sm text-primary underline">Manage your Dataverse connection</Link>
      <FlowRecordEditor table={table} recordId={record.id} onSaved={saved} />
    </DialogContent>
  </Dialog>;
}