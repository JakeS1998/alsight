import React from 'react';
import { LayoutGrid, List, Map } from 'lucide-react';
const views = [{ value: 'cards', label: 'Cards', icon: LayoutGrid }, { value: 'list', label: 'List', icon: List }, { value: 'map', label: 'Map', icon: Map }];
const selected = 'bg-primary text-primary-foreground shadow-sm';
const unselected = 'text-muted-foreground hover:bg-muted hover:text-foreground';
export default function ProjectViewControls({ view, onViewChange, density, onDensityChange }) {
  return <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
    {view === 'list' && <div role="group" aria-label="List density" className="inline-flex rounded-lg border border-border bg-card p-1">
      {['compact', 'comfortable'].map(value => <button key={value} type="button" aria-pressed={density === value} onClick={() => onDensityChange(value)} className={`rounded-md px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${density === value ? selected : unselected}`}>{value === 'compact' ? 'Compact' : 'Comfortable'}</button>)}
    </div>}
    <div role="group" aria-label="Project view" className="inline-flex rounded-lg border border-border bg-card p-1">
      {views.map(({ value, label, icon: Icon }) => <button key={value} type="button" aria-pressed={view === value} onClick={() => onViewChange(value)} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${view === value ? selected : unselected}`}><Icon className="h-3.5 w-3.5" />{label}</button>)}
    </div>
  </div>;
}