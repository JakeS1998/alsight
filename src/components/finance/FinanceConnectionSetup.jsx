import React, { useState } from 'react';
import { useQuery,useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import FinanceSourceFields from '@/components/finance/FinanceSourceFields';
import FinanceSummary from '@/components/finance/FinanceSummary';
import FinanceProjectRows from '@/components/finance/FinanceProjectRows';
import { financeCall } from '@/components/finance/financeClient';
export default function FinanceConnectionSetup(){
 const client=useQueryClient(),q=useQuery({queryKey:['finance-status'],queryFn:()=>financeCall({action:'status'})});
 const [draft,setDraft]=useState(null),[preview,setPreview]=useState(null),[busy,setBusy]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const config=q.data?.config,form=draft||{reportURL:config?.report_url||'',sources:config?.sources||{SO:{},PO:{}}};
 const edit=changes=>{setDraft({...form,...changes});setPreview(null);setNotice('');};
 async function run(action){setBusy(action);setError('');setNotice('');try{const d=await financeCall(action==='configure'?{action, ...form}:action==='confirm'?{action,revision:preview.revision}:{action});if(action==='preview')setPreview(d);else{setNotice(d.notice);if(action==='configure'){setDraft(null);setPreview(null);}await client.invalidateQueries({queryKey:['finance-status']});await client.invalidateQueries({queryKey:['finance']});}}catch(e){setError(e.message);}finally{setBusy('');}}
 if(q.isPending)return <p role="status">Loading reporting setup…</p>;
 if(q.error)return <p role="alert" className="text-destructive">{q.error.message}</p>;
 return <section className="space-y-5 rounded-panel border border-border bg-card p-6"><div><h2 className="font-heading text-xl font-semibold">Power BI reporting connection</h2><p className="mt-1 text-sm text-muted-foreground">Use the report’s semantic model as the primary SO/PO source. Report-page filters are not applied to these model queries. Table and column names are available in the report’s semantic model. Select GBP net-value columns excluding VAT and verify the totals before confirming.</p></div>
 <form onSubmit={e=>{e.preventDefault();run('configure');}} className="space-y-4"><div><Label htmlFor="finance-report-link">Power BI workspace report link</Label><Input id="finance-report-link" type="url" required value={form.reportURL} onChange={e=>edit({reportURL:e.target.value})} placeholder="Paste the report link from its Power BI workspace"/></div><div className="grid gap-4 xl:grid-cols-2">{['SO','PO'].map(type=><FinanceSourceFields key={type} type={type} value={form.sources[type]} onChange={value=>edit({sources:{...form.sources,[type]:value}})}/>)}</div><Button disabled={Boolean(busy)} type="submit">{busy==='configure'?'Checking report…':'Save & check report'}</Button></form>
 {config&&<div className="space-y-4 border-t border-border pt-4"><p className="text-sm"><strong>{config.report_name}</strong> · {q.data.confirmed?'Confirmed for reporting':'Awaiting data review'}</p><Button variant="outline" disabled={Boolean(busy)||Boolean(draft)} onClick={()=>run('preview')}>{busy==='preview'?'Reading live data…':'Preview live SO/PO data'}</Button>{draft&&<p className="text-sm text-muted-foreground">Save your changes before previewing.</p>}{preview&&<div className="space-y-4"><FinanceSummary data={preview.summary}/><FinanceProjectRows rows={preview.rows} onSelect={()=>setNotice('Preview only: confirm this source, then open Finance to view transaction details.')}/><p className="text-sm text-muted-foreground">Preview read: {new Date(preview.read_at).toLocaleString('en-GB')}. Empty tables and missing values are not replaced with invented figures.</p><Button disabled={Boolean(busy)} onClick={()=>run('confirm')}>{busy==='confirm'?'Confirming…':'Confirm this reporting source'}</Button></div>}</div>}
 {error&&<p role="alert" className="text-destructive">{error}</p>}{notice&&<p role="status" className="text-success">{notice}</p>}</section>;
}