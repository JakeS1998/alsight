import React,{useEffect,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {financeCall} from '@/components/finance/financeClient';
import FinanceOutstandingInvoiceRows from '@/components/finance/FinanceOutstandingInvoiceRows';
export default function FinanceOutstandingInvoices({scope,snapshot}){
 const [kind,setKind]=useState('all'),[age,setAge]=useState('all'),[text,setText]=useState(''),[search,setSearch]=useState(''),[after,setAfter]=useState(null);
 useEffect(()=>{const timer=setTimeout(()=>{setSearch(text);setAfter(null);},350);return()=>clearTimeout(timer);},[text]);
 const q=useQuery({queryKey:['finance','balance-invoices',scope,snapshot,kind,age,search,after],queryFn:()=>financeCall({action:'balanceInvoices',kind,age,search,after}),staleTime:60000});
 const selectClass='h-9 rounded-md border border-input bg-card px-3 text-sm';
 return <div className="mt-6"><h3 className="font-semibold">Outstanding invoices</h3><div className="my-4 flex flex-wrap gap-3"><select aria-label="Creditor or debtor" className={selectClass} value={kind} onChange={e=>{setKind(e.target.value);setAfter(null);}}><option value="all">Creditors and debtors</option><option value="creditors">Creditors</option><option value="debtors">Debtors</option></select><select aria-label="Invoice ageing" className={selectClass} value={age} onChange={e=>{setAge(e.target.value);setAfter(null);}}>{['all','overdue','Current','1–30 days','31–60 days','61–90 days','90+ days','No due date'].map(v=><option key={v} value={v}>{v==='all'?'All outstanding':v==='overdue'?'Overdue only':v}</option>)}</select><Input className="max-w-md" aria-label="Search outstanding invoices" placeholder="Search supplier, customer, invoice or project…" maxLength={120} value={text} onChange={e=>setText(e.target.value)}/></div>{q.isFetching&&<p role="status">Reading outstanding invoices…</p>}{q.error&&<p role="alert" className="text-destructive">{q.error.message}</p>}{q.data&&<FinanceOutstandingInvoiceRows items={q.data.items}/>}<div className="mt-4 flex gap-2">{after&&<Button variant="outline" onClick={()=>setAfter(null)}>First invoices</Button>}{q.data?.has_more&&<Button variant="outline" disabled={q.isFetching} onClick={()=>setAfter(q.data.next)}>Next invoices</Button>}</div></div>;
}