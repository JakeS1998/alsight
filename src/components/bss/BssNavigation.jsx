import React from 'react';
import { LayoutDashboard, FolderKanban, FileText, FileCheck2, Scale, ShieldCheck } from 'lucide-react';
import { bssRegisters } from '@/components/bss/bssConfig';
const icons = { FolderKanban, FileText, FileCheck2, Scale, ShieldCheck };
export default function BssNavigation({ tab, onChange }) {
  const entries = [['overview', { label: 'Drafting dashboard', icon: LayoutDashboard }], ...Object.entries(bssRegisters).map(([key, config]) => [key, { ...config, icon: icons[config.icon] }])];
  return <nav aria-label="BSS workspace" className="flex gap-1 overflow-x-auto rounded-panel border border-border bg-card p-1.5">
    {entries.map(([key, { label, icon: Icon }]) => <button key={key} type="button" onClick={() => onChange(key)} aria-current={tab === key ? 'page' : undefined} className={tab === key ? 'flex shrink-0 items-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground' : 'flex shrink-0 items-center gap-2 rounded-md px-4 py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground'}><Icon className="h-4 w-4" />{label}</button>)}
  </nav>;
}