import React from 'react';
import {Input} from '@/components/ui/input';
export default function IEInlineDateFields({value,set,summary=false}){
 const fields=[['start_date','Engagement start'],['target_date','Target completion'],...(!summary?[['completion_date','Actual completion']]:[])];
 return <div className="grid gap-4 sm:grid-cols-2">{fields.map(([key,label])=><label key={key} className="space-y-1 text-xs font-semibold">{label}<Input type="date" required={key==='completion_date'&&value.status==='completed'} disabled={key==='completion_date'&&value.status!=='completed'} value={value[key]||''} onChange={event=>set(key,event.target.value)}/></label>)}{!summary&&value.status!=='completed'&&<p className="text-xs text-muted-foreground sm:col-span-2">Set the status to Completed in Key information to record actual completion.</p>}</div>;
}