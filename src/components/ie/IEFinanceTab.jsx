import React,{useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Pencil} from 'lucide-react';
import {ieCall} from '@/components/ie/ieClient';
import {Button} from '@/components/ui/button';
import IEPanel from '@/components/ie/IEPanel';
import IEQueryState from '@/components/ie/IEQueryState';
import IEFinanceForm from '@/components/ie/IEFinanceForm';
import RecordUpdatedAt from '@/components/RecordUpdatedAt';
import {IE_PAYMENT_TYPES,ieMoney} from '@/components/ie/ieWorkConfig';
export default function IEFinanceTab({engagement,canEdit}){
 const [editing,setEditing]=useState(false),query=useQuery({queryKey:['ie-finance',engagement.id],queryFn:()=>ieCall('finance',{engagement_id:engagement.id}),retry:false}),item=query.data?.item;
 return <IEQueryState query={query}><div className="space-y-5"><IEPanel title="Engagement finance" description="Recorded GBP totals excluding VAT. These figures do not create or send invoices." actions={canEdit&&<Button size="sm" variant="outline" onClick={()=>setEditing(true)}><Pencil/>{item?'Edit finance':'Record finance'}</Button>}>
 {!item&&<p className="mb-6 text-sm text-muted-foreground">No finance totals recorded in ALSight yet.</p>}<dl className="grid gap-6 sm:grid-cols-3">{[['engagement_value','Engagement value'],['invoiced','Invoiced'],['added_value','Added value (FOC)']].map(([key,label])=><div key={key} className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-2 break-words text-2xl font-bold">{ieMoney(item?.[key])}</dd></div>)}</dl>
 <div className="mt-6 border-t border-border pt-5"><p className="text-xs text-muted-foreground">Payment arrangement</p><p className="mt-2 text-sm font-semibold">{IE_PAYMENT_TYPES[item?.payment_type||'']}</p></div>{item&&<div className="mt-5"><RecordUpdatedAt record={item}/><p className="mt-1 text-xs text-muted-foreground">Saved by {item.saved_by_name||'Not recorded'}</p></div>}
 </IEPanel><IEPanel title="Finance notes"><p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{item?.notes||'No finance notes recorded.'}</p></IEPanel>{engagement.origin?.startsWith('sharepoint:')&&<p className="text-xs leading-6 text-muted-foreground">Original workbook figures remain available under Overview → Original workbook details. No imported figures have been replaced.</p>}{editing&&<IEFinanceForm engagementId={engagement.id} item={item} onClose={()=>setEditing(false)}/>}</div></IEQueryState>;
}