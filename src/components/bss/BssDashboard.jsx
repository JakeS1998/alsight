import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowUpRight, FolderKanban, FileText, FileCheck2, Scale, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { bssRegisters, bssLinks } from '@/components/bss/bssConfig';
import { Button } from '@/components/ui/button';
import { canViewWorkspace } from '@/components/navigation/workspaceAccess';
const icons = { FolderKanban, FileText, FileCheck2, Scale, ShieldCheck };
const workspaces = { '/approvals': 'approvals', '/clients': 'network', '/suppliers': 'network', '/people': 'network', '/framework': 'framework' };
export default function BssDashboard({ onChange }) {
  const { user } = useAuth();
  const totals = useQuery({ queryKey: ['bss-totals', user?.id, user?.role], queryFn: async () => Object.fromEntries(await Promise.all(Object.entries(bssRegisters).map(async ([key, config]) => [key, await base44.entities[config.entity].count({ status: 'active' })]))), staleTime: 60000 });
  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-xl font-semibold">Drafting dashboard</h2><p className="mt-1 text-sm text-muted-foreground">Active records available to you, across the business support registers.</p></div><span className="text-xs text-muted-foreground">ALS Hub permissions apply</span></div>
    {totals.error && <div role="alert" className="rounded-panel border border-border bg-card p-4 text-sm text-destructive">Unable to load register totals. <Button variant="link" onClick={() => totals.refetch()}>Retry</Button></div>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{Object.entries(bssRegisters).map(([key, config]) => { const Icon = icons[config.icon]; return <button key={key} onClick={() => onChange(key)} className="rounded-panel border border-border bg-card p-5 text-left hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><div className="flex items-center justify-between"><span className="rounded-md bg-muted p-2"><Icon className="h-5 w-5 text-foreground" /></span><ArrowUpRight className="h-4 w-4 text-muted-foreground" /></div><p className="mt-5 text-3xl font-semibold tabular-nums">{totals.isPending ? '…' : totals.data?.[key]?.toLocaleString() ?? '—'}</p><p className="mt-1 text-sm text-muted-foreground">{config.label}</p></button>; })}</div>
    <section className="rounded-panel border border-border bg-card p-5"><h3 className="font-semibold">Business support tools</h3><p className="mt-1 text-sm text-muted-foreground">Shared ALS Hub records and the useful links from Business Support Hub.</p><div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{bssLinks.filter(([, href, internal]) => !internal || canViewWorkspace(user, workspaces[href])).map(([label, href, internal]) => internal ? <Link key={label} to={href} className="flex items-center justify-between rounded-md border border-border p-3 text-sm hover:bg-muted">{label}<ArrowUpRight className="h-4 w-4" /></Link> : <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-md border border-border p-3 text-sm hover:bg-muted">{label}<ArrowUpRight className="h-4 w-4" /></a>)}</div></section>
    <p className="text-xs text-muted-foreground">Registers use existing synced ALS Hub records, not a separate copy. Editable fields use your own Microsoft connection and existing Dataverse write permissions; approval decisions stay in Approvals.</p>
  </div>;
}