import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import ProjectValuationsTab from '@/components/valuations/ProjectValuationsTab';
export default function AliceValuationTask({ selectedProject, onBack, onCancel }) {
  const { user } = useAuth();
  const query = useQuery({ queryKey: ['alice-valuation-project', selectedProject.id, user?.id], queryFn: async () => ['supplier', 'project_manager'].includes(user?.role) ? (await base44.functions.invoke('manageValuation', { action: 'project', projectId: selectedProject.id })).data.project : base44.entities.Project.get(selectedProject.id) });
  return <div className="flex min-h-0 flex-1 flex-col"><div className="border-b border-border bg-muted/60 px-4 py-3"><p className="text-sm font-semibold">ALICE · Valuation for {selectedProject.name}</p><p className="mt-1 text-xs text-muted-foreground">Complete, attach evidence and submit here without leaving this page. Existing review and authorisation rules apply.</p><button type="button" onClick={onBack} className="mt-2 text-xs font-semibold text-assistant">Change project</button></div><div className="min-h-0 flex-1 overflow-auto p-4">{query.isPending ? <p role="status">Loading your project…</p> : query.isError ? <p role="alert" className="text-sm text-destructive">{query.error.response?.data?.error || query.error.message}</p> : query.data ? <ProjectValuationsTab key={query.data.id} project={query.data} /> : <p className="text-sm">This project is unavailable.</p>}</div><div className="border-t border-border px-4 py-3"><button type="button" onClick={onCancel} className="text-sm font-semibold text-assistant">Done</button></div></div>;
}