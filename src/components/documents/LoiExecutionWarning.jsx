import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import organisationQueryPolicy from '@/components/data/organisationQueryPolicy';

export default function LoiExecutionWarning({ doc }) {
  const { user } = useAuth(), client = useQueryClient();
  const enabled = !!user?.id && !!doc.loi_expiry_date && !!doc.project_id && doc.executed !== 'yes' && doc.status !== 'inactive';
  const queryKey = ['loi-execution-check', user?.id, user?.role, doc.project_id];
  const query = useQuery({
    queryKey, enabled, ...organisationQueryPolicy,
    queryFn: async () => {
      const { items } = await base44.entities.Project.filter({ $or: [{ id: doc.project_id }, { dataverse_id: doc.project_id }] }, { limit: 2, fields: ['dataverse_id'] });
      if (items.length !== 1) throw new Error('Project could not be uniquely identified.');
      return base44.entities.LegalDocument.count({
        project_id: { $in: [items[0].id, items[0].dataverse_id].filter(Boolean) }, executed: 'yes', status: { $ne: 'inactive' },
        $or: [{ document_type: { $regex: '^(loi|loi[ _-]+extension|letter of intent([ _-]+extension)?)$', $options: 'i' } }, { document_type: 'other', comments: { $regex: '\\bloi\\b|letter of intent', $options: 'i' } }],
      });
    },
  });
  useEffect(() => {
    if (!enabled) return;
    return base44.entities.LegalDocument.subscribe(() => client.invalidateQueries({ queryKey: ['loi-execution-check', user.id, user.role, doc.project_id] }));
  }, [enabled, client, user?.id, user?.role, doc.project_id]);
  if (!enabled) return null;
  if (query.isPending) return <p className="text-muted-foreground" role="status">Checking project LOI execution…</p>;
  if (query.isError) return <p className="text-risk-elevated">Unable to check project LOI execution.</p>;
  if (query.data !== 0) return null;
  return <p className="flex items-start gap-1 rounded-md border border-risk-elevated/30 bg-risk-elevated/10 p-2 text-risk-elevated" role="status"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /><span>Unexecuted LOI date: this project has no executed LOI recorded. Confirm execution before relying on this expiry.</span></p>;
}