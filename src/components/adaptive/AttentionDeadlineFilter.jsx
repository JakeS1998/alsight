import React from 'react';
import {deadlineFilters} from '@/components/adaptive/attentionDeadlines';

export default function AttentionDeadlineFilter({value,onChange}) {
 return <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Filter by deadline (oldest first)">
  {deadlineFilters.map(([key,label])=><button key={key} type="button" aria-pressed={value===key} onClick={()=>onChange(key)} className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold ${value===key?'border-foreground bg-foreground text-background':'border-border bg-card text-foreground hover:bg-muted'}`} title={key==='soon'?'Due today or in the next 7 days':key==='later'?'Due more than 7 days from today':undefined}>{label}</button>)}
 </div>;
}