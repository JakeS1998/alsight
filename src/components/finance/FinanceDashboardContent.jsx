import React, { useState,useEffect } from 'react';
import { useQuery,useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription } from '@/components/ui/dialog';
import FinanceSummary from '@/components/finance/FinanceSummary';
import FinanceProjectRows from '@/components/finance/FinanceProjectRows';
import FinanceTransactions from '@/components/finance/FinanceTransactions';
import { financeCall } from '@/components/finance/financeClient';
export default function FinanceDashboardContent(){
 const client=useQueryClient(),[text,setText]=useState(''),[search,setSearch]=useState(''),[after,setAfter]=useState(null),[selected,setSelected]=useState(null);
 useEffect(()=>{const timer=setTimeout(()=>{setSearch(text);setAfter(null);},350);return()=>clearTimeout(timer);},[text]);
 const summary=useQuery({queryKey:['finance','summary'],queryFn:()=>financeCall({action:'summary'}),staleTime:60000});
 const list=useQuery({queryKey:['finance','projects',search,after],queryFn:()=>financeCall({action:'list',search,after}),staleTime:60000});
 const refresh=()=>{client.invalidateQueries({queryKey:['finance']});client.invalidateQueries({queryKey:['finance-orders']});client.invalidateQueries({queryKey:['finance-invoices']});};
 return <div className="space-y-5">{summary.isPending&&<p role="status">Reading reporting totals…</p>}{summary.error&&<p role="alert" className="text-destructive">Reporting totals unavailable: {summary.error.message}</p>}{summary.data&&<><FinanceSummary data={summary.data.summary}/><p className="text-xs text-muted-foreground">Model totals read {new Date(summary.data.read_at).toLocaleString('en-GB')}. Project groups are source name/code combinations, not necessarily unique Dataverse projects. {summary.data.summary.Missing>0?'Some values are missing; totals are incomplete and require reconciliation.':''}</p></>}
 <div className="flex flex-wrap justify-between gap-3"><Input aria-label="Search Power BI projects" maxLength={120} placeholder="Search Power BI project name or original code…" className="max-w-md" value={text} onChange={e=>setText(e.target.value)}/><Button variant="outline" disabled={summary.isFetching||list.isFetching} onClick={refresh}>Refresh live figures</Button></div>{list.isFetching&&<p role="status">Reading projects and checking name matches…</p>}{list.error&&<p role="alert" className="text-destructive">{list.error.message}</p>}{list.data&&<FinanceProjectRows rows={list.data.items} onSelect={setSelected}/>}<div className="flex gap-2">{after&&<Button variant="outline" onClick={()=>setAfter(null)}>First projects</Button>}{list.data?.has_more&&<Button variant="outline" onClick={()=>setAfter(list.data.next)}>Next projects</Button>}</div>
 <Dialog open={Boolean(selected)} onOpenChange={open=>{if(!open)setSelected(null);}}><DialogContent className="max-h-[90vh] w-[95vw] max-w-6xl overflow-y-auto"><DialogHeader><DialogTitle>{selected?.Project||'Source-project transactions'}</DialogTitle><DialogDescription>Power BI reporting with Dataverse detail and reconciliation.</DialogDescription></DialogHeader>{selected&&<FinanceTransactions key={selected.source_key} row={selected}/>}</DialogContent></Dialog></div>;
}