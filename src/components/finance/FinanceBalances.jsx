import React,{useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {financeCall} from '@/components/finance/financeClient';
import useCommercialScope from '@/components/finance/useCommercialScope';
import FinanceBalanceTotals from '@/components/finance/FinanceBalanceTotals';
import FinanceBalanceTrend from '@/components/finance/FinanceBalanceTrend';
import FinanceOutstandingInvoices from '@/components/finance/FinanceOutstandingInvoices';
import LoadingPanel from '@/components/loading/LoadingPanel';
import FinanceBalanceToggle from '@/components/finance/FinanceBalanceToggle';
export default function FinanceBalances({snapshot}){
 const [kind,setKind]=useState('creditors');
 const client=useQueryClient(),scope=useCommercialScope(),q=useQuery({queryKey:['finance','balance-summary',scope,snapshot],queryFn:()=>financeCall({action:'balanceSummary'}),staleTime:60000});
 return <section className="finance-card finance-section"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2>{kind==='creditors'?'Creditors':'Debtors'}</h2><p className="text-sm text-muted-foreground">{q.data?.scope==='projects'?'Your permitted projects':'Company-wide'}{q.data?` · As at ${new Date(`${q.data.as_of}T12:00:00`).toLocaleDateString('en-GB')}`:''}</p></div><div className="flex flex-wrap items-center gap-3"><FinanceBalanceToggle value={kind} onChange={setKind}/><Button variant="outline" disabled={q.isFetching} onClick={()=>{client.invalidateQueries({queryKey:['finance','balance-summary']});client.invalidateQueries({queryKey:['finance','balance-invoices']});client.invalidateQueries({queryKey:['finance','balance-trend']});}}>Refresh balances</Button></div></div>{q.isPending&&<div role="status" aria-label="Loading balances" aria-busy="true"><LoadingPanel framed={false} rows={4}/></div>}{q.error&&<p role="alert" className="text-destructive">{q.error.message}</p>}{q.data&&<><FinanceBalanceTotals data={q.data} kind={kind}/>{q.data.totals.some(t=>t.kind===kind&&t.missing>0)&&<p role="alert" className="mt-3 text-sm text-destructive">Some invoices have no reliable balance; affected totals are unavailable.</p>}<FinanceOutstandingInvoices key={kind} scope={scope} snapshot={snapshot} kind={kind}/><FinanceBalanceTrend scope={scope} snapshot={snapshot} kind={kind}/></>}</section>;
}