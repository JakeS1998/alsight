import React,{useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Pencil} from 'lucide-react';
import {ieCall} from '@/components/ie/ieClient';
import {Button} from '@/components/ui/button';
import IEPanel from '@/components/ie/IEPanel';
import IEQueryState from '@/components/ie/IEQueryState';
import IEFinanceForm from '@/components/ie/IEFinanceForm';
import RecordUpdatedAt from '@/components/RecordUpdatedAt';
import IEFinanceSummary from '@/components/ie/IEFinanceSummary';
import {IE_PAYMENT_TYPES,ieMoney} from '@/components/ie/ieWorkConfig';
export default function IEFinanceTab({engagement,canEdit}){
 const [editing,setEditing]=useState(false),query=useQuery({queryKey:['ie-finance',engagement.id],queryFn:()=>ieCall('finance',{engagement_id:engagement.id}),retry:false}),item=query.data?.item;
 return <IEQueryState query={query}><div className="space-y-5"><IEPanel title="Engagement finance" description="Recorded GBP totals excluding VAT. These figures do not create or send invoices." actions={canEdit&&<Button size="sm" variant="outline" onClick={()=>setEditing(true)}><Pencil/>{item?'Edit finance':'Record finance'}</Button>}>
 {!item&&<p className="mb-6 text-sm text-muted-foreground">No finance totals recorded in ALS Hub yet.</p>}{item?.source==='workbook'&&<p className="mb-6 text-sm text-muted-foreground">Brought forward from the original I&E workbook. Edit finance to update these figures.</p>}<IEFinanceSummary item={item}/>
 <p className="mt-5 text-xs text-muted-foreground">SAM time and value are recorded GBP amounts, not hours. ALS cost is the recorded total; it is not added to its component costs.</p>
 <div className="mt-6 border-t border-border pt-5"><p className="text-xs text-muted-foreground">Payment arrangement</p><p className="mt-2 text-sm font-semibold">{IE_PAYMENT_TYPES[item?.payment_type||'']}</p></div>{item&&<div className="mt-5"><RecordUpdatedAt record={item}/><p className="mt-1 text-xs text-muted-foreground">Saved by {item.saved_by_name||'Not recorded'}</p></div>}
 </IEPanel><IEPanel title="Invoices — Coming soon" description="Invoice-level records and source mapping are not yet connected."><p className="text-sm text-muted-foreground">I&E invoiced payment can be recorded manually above while invoice mapping is reviewed.</p></IEPanel><IEPanel title="Finance notes"><p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{item?.notes||'No finance notes recorded.'}</p></IEPanel>{engagement.origin?.startsWith('sharepoint:')&&<p className="text-xs leading-6 text-muted-foreground">Original workbook figures remain available under Overview → Original workbook details. No imported figures have been replaced.</p>}{editing&&<IEFinanceForm engagementId={engagement.id} item={item} onClose={()=>setEditing(false)}/>}</div></IEQueryState>;
}