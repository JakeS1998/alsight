import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import AliceLookup from '@/components/alice/AliceLookup';
export default function AliceValuationProjectInput({ value, onChange }) {
  const { user } = useAuth();
  const external = ['supplier', 'project_manager'].includes(user?.role);
  const query = useQuery({ queryKey: ['alice-valuation-projects', user?.id], enabled: external, queryFn: async () => (await base44.functions.invoke('manageValuation', { action: 'projects' })).data.projects });
  if (!external) return <AliceLookup type="project" value={value} onChange={onChange} />;
  if (query.isPending) return <p role="status" className="text-sm">Loading your valuation projects…</p>;
  if (query.isError) return <p role="alert" className="text-sm text-destructive">{query.error.response?.data?.error || query.error.message}</p>;
  const projects = query.data || [];
  return <div><select aria-label="Choose valuation project" value={value?.id || ''} onChange={e => onChange(projects.find(p => p.id === e.target.value) || null)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="">Select project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name} · {p.project_number}</option>)}</select>{!projects.length && <p className="mt-2 text-sm text-muted-foreground">No valuation projects are available to your account.</p>}</div>;
}