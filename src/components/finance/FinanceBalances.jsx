import React from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {financeCall} from '@/components/finance/financeClient';
import useCommercialScope from '@/components/finance/useCommercialScope';
import FinanceBalanceTotals from '@/components/finance/FinanceBalanceTotals';
import FinanceBalanceAgeing from '@/components/finance/FinanceBalanceAgeing';
import FinanceOutstandingInvoices from '@/components/finance/FinanceOutstandingInvoices';
export default function FinanceBalances({snapshot}){
 const client=useQueryClient(),scope=useCommercialScope(),q=useQuery({queryKey:['finance','balance-summary',scope,snapshot],queryFn:()=>financeCall({action:'balanceSummary'}),staleTime:60000});
 return <section className="finance-card finance-section"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2>Creditors & debtors</h2><p className="text-sm text-muted-foreground">Company-wide{q.data?` · As at ${new Date(`${q.data.as_of}T12:00:00`).toLocaleDateString('en-GB')}`:''}</p></div><Button variant="outline" disabled={q.isFetching} onClick={()=>{client.invalidateQueries({queryKey:['finance','balance-summary']});client.invalidateQueries({queryKey:['finance','balance-invoices']});}}>Refresh balances</Button></div>{q.isPending&&<p role="status">Reading Power BI balances…</p>}{q.error&&<p role="alert" className="text-destructive">{q.error.message}</p>}{q.data&&<><FinanceBalanceTotals data={q.data}/>{q.data.totals.some(t=>t.missing>0)&&<p role="alert" className="mt-3 text-sm text-destructive">Some invoices have no reliable balance; affected totals are unavailable.</p>}<FinanceBalanceAgeing data={q.data}/><FinanceOutstandingInvoices scope={scope} snapshot={snapshot}/></>}</section>;
}