import React from 'react';
import {CalendarDays,CheckCircle2,Flag} from 'lucide-react';
import IEEditablePanel from '@/components/ie/IEEditablePanel';
import IEEditableField from '@/components/ie/IEEditableField';
import {formatDate} from '@/lib/portal';

export default function IEEngagementDates({item,canEdit}){
 const dates=[[CalendarDays,'Engagement start',item.start_date,'start_date'],[Flag,'Target completion',item.target_date,'target_date'],[CheckCircle2,'Actual completion',item.completion_date,'completion_date']];
 return <IEEditablePanel title="Important dates" section="dates" item={item} canEdit={canEdit} className="h-full"><dl className="space-y-5">
  {dates.map(([Icon,label,date,field])=><div key={label} className="flex items-start gap-3"><Icon className={`mt-0.5 h-4 w-4 shrink-0 ${date?'text-primary':'text-muted-foreground'}`}/><div className="min-w-0 flex-1"><dt className="text-xs font-semibold">{label}</dt><dd className="mt-1 text-xs text-muted-foreground"><IEEditableField field={field} label={label} disabled={field==='completion_date'&&item.status!=='completed'}>{date?<time dateTime={date}>{formatDate(date)}</time>:'Not recorded'}</IEEditableField></dd></div></div>)}
 </dl></IEEditablePanel>;
}