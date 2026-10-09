import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs,TabsList,TabsTrigger,TabsContent } from '@/components/ui/tabs';
import FinanceOrderRows from '@/components/finance/FinanceOrderRows';
import FinanceInvoices from '@/components/finance/FinanceInvoices';
import FinancePODetail from '@/components/finance/FinancePODetail';
import { financeCall } from '@/components/finance/financeClient';
export default function FinanceTransactions({row}){
 const [type,setType]=useState('PO'),[after,setAfter]=useState(null),[poId,setPOId]=useState(null);
 const q=useQuery({queryKey:['finance-orders',row.source_key,type,after],queryFn:()=>financeCall({action:'orders',sourceKey:row.source_key,type,after}),enabled:['SO','PO'].includes(type),staleTime:60000});
 return <div className="space-y-4"><p className="text-sm text-muted-foreground">Power BI source code: {row.Code||'Not supplied'}. Amounts are GBP net values excluding VAT.</p>{row.mapping.project_id?<Link className="text-sm font-semibold text-primary underline" to={`/projects/${row.mapping.project_id}`}>Linked project: {row.mapping.project_name} · {row.mapping.project_code}</Link>:<p className="text-sm text-destructive">Project is {row.mapping.status}; sales invoices cannot be linked until an administrator saves a project mapping.</p>}
 <Tabs value={type} onValueChange={v=>{setType(v);setAfter(null);setPOId(null);}}><TabsList><TabsTrigger value="PO">Purchase orders</TabsTrigger><TabsTrigger value="SO">Sales orders</TabsTrigger><TabsTrigger value="invoices">Sales invoices</TabsTrigger></TabsList>{['SO','PO'].map(v=><TabsContent key={v} value={v} className="space-y-4">{q.isPending&&<p role="status">Reading live Power BI orders…</p>}{q.error&&<p role="alert" className="text-destructive">{q.error.message}</p>}{q.data&&<><p className="text-xs text-muted-foreground">Power BI read {new Date(q.data.read_at).toLocaleString('en-GB')}. Dataverse PO headers and supplier details are synced records; an absent synced record does not prove the transaction is absent from Dataverse.</p><FinanceOrderRows type={v} rows={q.data.items} onPO={setPOId}/><div className="flex gap-2">{after&&<Button variant="outline" onClick={()=>setAfter(null)}>First orders</Button>}{q.data.has_more&&<Button variant="outline" onClick={()=>setAfter(q.data.next)}>Next orders</Button>}</div></>}{poId&&<FinancePODetail key={poId} poId={poId} onClose={()=>setPOId(null)}/>}</TabsContent>)}<TabsContent value="invoices">{type==='invoices'&&<FinanceInvoices sourceKey={row.source_key}/>}</TabsContent></Tabs></div>;
}