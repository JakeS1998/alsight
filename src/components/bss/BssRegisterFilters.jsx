import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
export default function BssRegisterFilters({ tab, state }) {
  const views = tab === 'projects' ? [['all', 'All projects'], ['live', 'Live projects'], ['uklf', 'UKLF projects']] : [['all', 'All records'], ['outstanding', 'Not executed'], ['executed', 'Executed'], ['due', tab === 'warranties' ? 'Warranty due date passed' : 'Drafting due date passed']];
  return <div className="flex flex-wrap gap-3">
    <div className="relative min-w-60 flex-1"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search BSS records" placeholder={tab === 'projects' ? 'Search project, reference or client…' : 'Search reference or project…'} value={state.search} onChange={e => state.setSearch(e.target.value)} className="pl-9" /></div>
    <select aria-label="Register view" value={state.view} onChange={e => state.setView(e.target.value)} className="rounded-md border border-input bg-card px-3 py-2 text-sm">{views.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
    <select aria-label="Record status" value={state.status} onChange={e => state.setStatus(e.target.value)} className="rounded-md border border-input bg-card px-3 py-2 text-sm"><option value="active">Active</option><option value="inactive">Inactive</option></select>
    <select aria-label="Sort records" value={state.sort} onChange={e => state.setSort(e.target.value)} className="rounded-md border border-input bg-card px-3 py-2 text-sm"><option value="-updated_date">Recently updated</option><option value={tab === 'projects' ? 'name' : tab === 'warranties' ? 'warranty_id' : 'document_id'}>Reference / name</option><option value="-created_date">Newest created</option></select>
  </div>;
}