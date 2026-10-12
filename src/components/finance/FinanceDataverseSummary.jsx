import React from 'react';
import FinanceExecutiveBriefing from '@/components/finance/FinanceExecutiveBriefing';
import FinanceCostRanking from '@/components/finance/FinanceCostRanking';
import { formatCurrency } from '@/lib/portal';
export default function FinanceDataverseSummary({data,pipeline,section='briefing'}){
 const value=kind=>data.amounts.find(r=>r.kind===kind&&r.has_amount),missing=(data.po_commitments?.missing_count||0)+(data.po_commitments?.partial_count||0);
 const invoices=data.amounts.filter(r=>r.kind==='invoices').reduce((n,r)=>n+r.count,0),review=data.matches.filter(r=>['unmatched','ambiguous'].includes(r.status)).reduce((n,r)=>n+r.count,0);
 const orders=data.amounts.filter(r=>r.kind==='purchase_orders').reduce((n,r)=>n+r.count,0);
 const cards=[['PO Commitments',data.po_commitments?.amount!=null?formatCurrency(data.po_commitments.amount):'Unavailable','ALSight-linked projects only; net of VAT. Blank headers use available line-item sums'],['Purchase orders',orders,'Active purchase orders for ALSight-linked projects only'],['Invoice value',value('invoices')?formatCurrency(value('invoices').sum_amount):'Unavailable','Sales invoices, net of VAT'],['Invoices received',invoices,'Sales-invoice records received from Dataverse, not cash receipts']];
 if(data.powerbi){const sales=data.amounts.filter(r=>r.kind==='sales_orders');cards.splice(0,cards.length,['PO Commitments',data.po_commitments?.amount!=null?formatCurrency(data.po_commitments.amount):'Unavailable','Power BI model totals for ALSight-linked projects; VAT basis not verified'],['Purchase orders',orders,'Power BI orders linked to ALSight projects'],['Client invoice value',value('sales_orders')?formatCurrency(value('sales_orders').sum_amount):'Unavailable','Power BI model totals for ALSight-linked projects'],['Client invoices',sales.reduce((n,r)=>n+r.count,0),'Sales-order records represent client invoices, not cash receipts']);}
  return section==='ranking'?<FinanceCostRanking data={data}/>:<FinanceExecutiveBriefing data={data} pipeline={pipeline} cards={cards} missing={missing} review={review}/>;
}