import React from 'react';
import FinanceExecutiveBriefing from '@/components/finance/FinanceExecutiveBriefing';
import FinanceCostRanking from '@/components/finance/FinanceCostRanking';
import { formatCurrency } from '@/lib/portal';
export default function FinanceDataverseSummary({data,pipeline,section='briefing'}){
 const value=kind=>data.amounts.find(r=>r.kind===kind&&r.has_amount),missing=data.amounts.find(r=>r.kind==='purchase_orders'&&!r.has_amount)?.count||0;
 const invoices=data.amounts.filter(r=>r.kind==='invoices').reduce((n,r)=>n+r.count,0),review=data.matches.filter(r=>['unmatched','ambiguous'].includes(r.status)).reduce((n,r)=>n+r.count,0);
 const orders=data.amounts.filter(r=>r.kind==='purchase_orders').reduce((n,r)=>n+r.count,0);
 const cards=[['PO Commitments',value('purchase_orders')?formatCurrency(value('purchase_orders').sum_amount):'Unavailable','Recorded PO header values, net of VAT'],['Purchase orders',orders,'Active purchase-order records'],['Invoice value',value('invoices')?formatCurrency(value('invoices').sum_amount):'Unavailable','Sales invoices, net of VAT'],['Invoices received',invoices,'Sales-invoice records received from Dataverse, not cash receipts']];
 return section==='ranking'?<FinanceCostRanking data={data}/>:<FinanceExecutiveBriefing data={data} pipeline={pipeline} cards={cards} missing={missing} review={review}/>;
}