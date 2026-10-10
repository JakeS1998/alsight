import React, { useState,useEffect } from 'react';
import { useQuery,useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription } from '@/components/ui/dialog';
import FinanceDataverseSummary from '@/components/finance/FinanceDataverseSummary';
import FinanceDataCoverage from '@/components/finance/FinanceDataCoverage.jsx';
import CommercialInsightsPanel from '@/components/finance/CommercialInsightsPanel';
import FinanceTransactionBrowser from '@/components/finance/FinanceTransactionBrowser.jsx';
import FinanceDataverseProjectRows from '@/components/finance/FinanceDataverseProjectRows';
import FinanceDataverseTransactions from '@/components/finance/FinanceDataverseTransactions';
import { financeCall } from '@/components/finance/financeClient';
import FinanceForecast from '@/components/finance/FinanceForecast';
import useCommercialScope from '@/components/finance/useCommercialScope';
export default function FinanceDashboardContent({snapshot,pipeline}){
 const scope=useCommercialScope();
 const client=useQueryClient(),[text,setText]=useState(''),[search,setSearch]=useState(''),[after,setAfter]=useState(null),[selected,setSelected]=useState(null);
 useEffect(()=>{const timer=setTimeout(()=>{setSearch(text);setAfter(null);},350);return()=>clearTimeout(timer);},[text]);
 const summary=useQuery({queryKey:['finance','dataverse-summary',scope,snapshot],queryFn:()=>financeCall({action:'summary'}),staleTime:60000});
 const list=useQuery({queryKey:['finance','dataverse-projects',scope,snapshot,search,after],queryFn:()=>financeCall({action:'list',search,after}),staleTime:60000});
 const refresh=()=>{client.invalidateQueries({queryKey:['finance']});client.invalidateQueries({queryKey:['finance-orders']});client.invalidateQueries({queryKey:['finance-invoices']});};
 return <div>{summary.isPending&&<p role="status">Reading reporting totals…</p>}{summary.error&&<p role="alert" className="text-destructive">Reporting totals unavailable: {summary.error.message}</p>}{summary.data&&<FinanceDataverseSummary data={summary.data} pipeline={pipeline}/>}
 <FinanceForecast/>
 {summary.data&&<div className="finance-analysis-row finance-section items-stretch"><div className="flex min-w-0 flex-col gap-6"><FinanceDataverseSummary data={summary.data} section="ranking"/><CommercialInsightsPanel data={summary.data}/></div><FinanceDataCoverage data={summary.data}/></div>}
 <div className="finance-directory-row finance-section"><section className="finance-card finance-delay-6"><h2>Project directory</h2><div className="finance-controls"><Input aria-label="Search Dataverse projects" maxLength={120} placeholder="Search Dataverse project name or original code…" className="max-w-md" value={text} onChange={e=>setText(e.target.value)}/><Button variant="outline" disabled={summary.isFetching||list.isFetching} onClick={refresh}>Refresh synced figures</Button></div>{list.isFetching&&<p role="status">Reading projects and checking name matches…</p>}{list.error&&<p role="alert" className="text-destructive">{list.error.message}</p>}{list.data&&<FinanceDataverseProjectRows rows={list.data.items} onSelect={setSelected}/>}<div className="mt-4 flex gap-2">{after&&<Button variant="outline" onClick={()=>setAfter(null)}>First projects</Button>}{list.data?.has_more&&<Button variant="outline" onClick={()=>setAfter(list.data.next)}>Next projects</Button>}</div></section><FinanceTransactionBrowser snapshot={snapshot}/></div>
 <Dialog open={Boolean(selected)} onOpenChange={open=>{if(!open)setSelected(null);}}><DialogContent className="max-h-[90vh] w-[95vw] max-w-6xl overflow-y-auto"><DialogHeader><DialogTitle>{selected?.Project||'Source-project transactions'}</DialogTitle><DialogDescription>Synced Dataverse transactions, supplier detail and reconciliation.</DialogDescription></DialogHeader>{selected&&<FinanceDataverseTransactions key={selected.source_key} row={selected}/>}</DialogContent></Dialog></div>;
}