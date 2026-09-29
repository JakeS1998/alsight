import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ProjectManagerOverview({ projectId, mode, supplier = false }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['project-manager-overview', projectId],
    queryFn: async () => (await base44.functions.invoke('manageValuation', { action: 'document_status', projectId })).data,
    staleTime: 60000,
  });
  const title = mode === 'timeline' ? 'Project-wide milestones' : supplier ? 'Other warranties' : 'Project warranties';
  const rows = mode === 'timeline' ? data?.timeline : data?.warranties;
  return <section className="space-y-3">
    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    {isLoading ? <p role="status" className="text-sm text-slate-500">Loading…</p> : error ? <p role="alert" className="text-sm text-destructive">Unable to load {title.toLowerCase()}.</p> : !rows?.length ? <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">Nothing recorded yet.</p> :
      <div className="space-y-2">
        {mode === 'timeline' ? rows.map((event, i) => <div key={`${event.date}-${event.label}-${i}`} className="flex flex-wrap justify-between gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <span className="font-medium text-slate-800">{event.label}</span>
          <time className="text-slate-500" dateTime={event.date}>{new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</time>
        </div>) : rows.map(w => <div key={w.id} className="flex flex-wrap justify-between gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <span className="font-medium text-slate-800">{[w.reference, w.service].filter(Boolean).join(' — ') || 'Warranty'}</span>
          <span className="text-slate-600">{w.status}</span>
        </div>)}
      </div>}
  </section>;
}