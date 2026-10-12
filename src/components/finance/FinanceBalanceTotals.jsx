import React from 'react';
import {formatCurrency} from '@/lib/portal';
export default function FinanceBalanceTotals({data}){
 return <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{data.totals.flatMap(t=>[{label:t.kind==='creditors'?'Creditors outstanding':'Debtors outstanding',amount:t.amount},{label:t.kind==='creditors'?'Creditors overdue':'Debtors overdue',amount:t.overdue}]).map(item=><div key={item.label} className="rounded-lg border border-border bg-muted p-4"><p className="text-sm text-muted-foreground">{item.label}</p><p className="mt-2 text-xl font-bold">{item.amount==null?'Unavailable':formatCurrency(item.amount)}</p></div>)}</div>;
}