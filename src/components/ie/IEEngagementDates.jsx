import React from 'react';
import {CalendarDays,CheckCircle2,Flag} from 'lucide-react';
import IEPanel from '@/components/ie/IEPanel';
import {formatDate} from '@/lib/portal';

export default function IEEngagementDates({item}){
 const dates=[[CalendarDays,'Engagement start',item.start_date],[Flag,'Target completion',item.target_date],[CheckCircle2,'Actual completion',item.completion_date]];
 return <IEPanel title="Important dates" className="h-full"><dl className="space-y-5">
  {dates.map(([Icon,label,date])=><div key={label} className="flex items-start gap-3"><Icon className={`mt-0.5 h-4 w-4 shrink-0 ${date?'text-primary':'text-muted-foreground'}`}/><div className="min-w-0 flex-1"><dt className="text-xs font-semibold">{label}</dt><dd className="mt-1 text-xs text-muted-foreground">{date?<time dateTime={date}>{formatDate(date)}</time>:'Not recorded'}</dd></div></div>)}
 </dl></IEPanel>;
}