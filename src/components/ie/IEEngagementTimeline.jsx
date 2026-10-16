import React from 'react';
import {CalendarDays,CheckCircle2,Flag} from 'lucide-react';
import IEPanel from '@/components/ie/IEPanel';
import IEEngagementDates from '@/components/ie/IEEngagementDates';
import {StatusBadge} from '@/components/StatusBadge';
import {IE_STATUSES} from '@/components/ie/ieClient';
import {formatDate} from '@/lib/portal';

export default function IEEngagementTimeline({item}){
 const milestones=[[CalendarDays,'Engagement start',item.start_date,'Recorded start date for this engagement.'],[Flag,'Target completion',item.target_date,'The planned completion date, not an actual completion.'],[CheckCircle2,'Actual completion',item.completion_date,'Recorded completion date.']];
 return <div className="grid items-start gap-5 xl:grid-cols-3"><IEPanel title="Engagement timeline" description="Recorded engagement dates. No delivery milestones or progress are assumed." className="xl:col-span-2">
  <ol>{milestones.map(([Icon,label,date,note],index)=><li key={label} className="relative flex gap-4 pb-9 last:pb-0">{index<milestones.length-1&&<div className="absolute bottom-0 left-[17px] top-9 w-px bg-border" aria-hidden="true"/>}<span className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${date?'border-primary/30 bg-primary/10 text-primary':'border-border bg-muted text-muted-foreground'}`}><Icon className="h-4 w-4"/></span><div className="min-w-0 flex-1 pt-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">{label}</h3><span className="rounded-md bg-secondary px-2 py-1 text-[10px] font-semibold">{date?'Date recorded':'Not recorded'}</span></div><p className="mt-1 text-sm font-medium">{date?formatDate(date):'No date recorded'}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{note}</p></div></li>)}</ol>
 </IEPanel><div className="space-y-5"><IEPanel title="Current position"><StatusBadge status={item.status} map={IE_STATUSES}/><p className="mt-3 text-xs leading-6 text-muted-foreground">The current engagement status is recorded separately from its dates.</p></IEPanel><IEEngagementDates item={item}/></div></div>;
}