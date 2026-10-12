import React from 'react';
import {formatCurrency} from '@/lib/portal';
import {monthLabel} from '@/components/finance/FinanceForecastMonths';
export default function FinanceForecastColumn({row,selected,height}){
 const basis=row.historical?'Recorded':'Forecast',invoice=row.invoice,po=row.po;
 return <div className="finance-chart-column" data-selected={row.month===selected}>
  <div className="finance-chart-bars">
   {invoice==null?<div className="finance-chart-unavailable">Unavailable</div>:<div className={row.historical?'finance-chart-bar bg-primary':'finance-chart-bar finance-chart-estimate'} style={{height:height(invoice)}} title={`${basis} client invoices: ${formatCurrency(invoice)}`}/>}
   {!row.historical&&!row.projects?<div className="w-[54px] text-center text-[10px] text-muted-foreground">No projects</div>:po==null?<div className="finance-chart-unavailable">Unavailable</div>:po===0?<div className="w-[54px] border-b-2 border-als-navy pb-1 text-center text-xs font-semibold">£0</div>:<div className="finance-chart-bar" style={{height:height(po)}} title={`${basis} POs: ${formatCurrency(po)}${!row.historical&&row.missingCosts?' (partial coverage)':''}`}/>}
  </div>
  <span className="finance-chart-value">Invoice {invoice==null?'Unavailable':formatCurrency(invoice)}</span>
  <span className="text-xs tabular-nums text-muted-foreground">PO {po==null?'Unavailable':formatCurrency(po)}{!row.historical&&row.projects>0&&po!=null&&row.missingCosts>0?' · partial':''} · {basis.toLowerCase()}</span>
  <span className="finance-chart-month">{monthLabel(row.month)}</span>
 </div>;
}