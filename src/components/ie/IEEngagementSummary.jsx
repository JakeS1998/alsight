import React from 'react';
import {CalendarDays,Flag,UserRound} from 'lucide-react';
import IEPanel from '@/components/ie/IEPanel';
import {formatDate} from '@/lib/portal';

export default function IEEngagementSummary({item}){
 const imported=item.origin?.startsWith('sharepoint:');
 const summary=imported ? [item.category_name,item.support_type_name].filter(Boolean).join(' · ') : item.description;
 return <IEPanel title="Engagement summary" className="h-full">
  <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{summary||'No background or scope recorded.'}</p>
  {imported&&<p className="mt-3 text-sm leading-6 text-muted-foreground">{[item.client_name,(item.sites||[]).join(', ')].filter(Boolean).join(' · ')}</p>}
  <div className="mt-6 border-t border-border pt-5"><h3 className="text-sm font-semibold">Expected outcome</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{item.expected_outcome||'An expected outcome has not yet been recorded.'}</p></div>
  <dl className="mt-6 grid gap-5 border-t border-border pt-5 sm:grid-cols-3">
   {[[UserRound,'Engagement owner',item.owner_name||'Unassigned'],[CalendarDays,'Start date',formatDate(item.start_date)],[Flag,'Target completion',formatDate(item.target_date)]].map(([Icon,label,value])=><div key={label} className="min-w-0"><dt className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5"/>{label}</dt><dd className="mt-2 break-words text-sm font-bold">{value}</dd></div>)}
  </dl>
  {imported&&item.description&&<details className="mt-6 border-t border-border pt-4"><summary className="cursor-pointer text-xs font-semibold text-muted-foreground">Original workbook details</summary><p className="mt-4 whitespace-pre-wrap break-words text-xs leading-6 text-muted-foreground">{item.description}</p></details>}
 </IEPanel>;
}