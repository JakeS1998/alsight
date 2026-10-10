import React from 'react';
import FinanceExecutiveBriefing from '@/components/finance/FinanceExecutiveBriefing';
import FinanceCostRanking from '@/components/finance/FinanceCostRanking';
import { formatCurrency } from '@/lib/portal';
export default function FinanceDataverseSummary({data,pipeline,section='briefing'}){
 const value=kind=>data.amounts.find(r=>r.kind===kind&&r.has_amount),missing=data.amounts.find(r=>r.kind==='purchase_orders'&&!r.has_amount)?.count||0;
 const invoices=data.amounts.filter(r=>r.kind==='invoices').reduce((n,r)=>n+r.count,0),review=data.matches.filter(r=>['unmatched','ambiguous'].includes(r.status)).reduce((n,r)=>n+r.count,0);
 const cards=[['PO header net commitments',value('purchase_orders')?formatCurrency(value('purchase_orders').sum_amount):'Unavailable'],['PO line-item net costs',value('line_items')?formatCurrency(value('line_items').sum_amount):'Unavailable'],['Sales-invoice net value',value('invoices')?formatCurrency(value('invoices').sum_amount):'Unavailable'],['Sales-invoice records',invoices],['Finance projects',data.amounts.filter(r=>r.kind==='projects').reduce((n,r)=>n+r.count,0)],['Projects needing a link',review]];
 return section==='ranking'?<FinanceCostRanking data={data}/>:<FinanceExecutiveBriefing data={data} cards={cards} missing={missing}/>;
}