import React from 'react';
import { formatCurrency } from '@/lib/portal';
import { monthLabel } from '@/components/finance/FinanceForecastMonths';
export default function FinanceForecastChart({rows,selected}) {
  const maximum=Math.max(...rows.flatMap(row=>[row.invoice,row.po||0]),1);
  const height=value=>`${value>0?Math.max(2,value/maximum*200):0}px`;
  return <div className="finance-forecast-visual">
    <div className="finance-chart-legend"><span><i className="finance-legend-estimate"/>Invoice forecast (estimate)</span><span><i className="finance-legend-po"/>PO monthly average (remaining budget); dashed = Unavailable</span></div>
    <p className="mb-3 text-xs text-muted-foreground">Remaining supplier budget ÷ remaining programme months. £0 means no uncommitted budget remains; unavailable means the budget or PO values are incomplete. Missing forecasts are excluded from the displayed PO total.</p>
    <div className="overflow-x-auto"><div className="finance-month-chart" style={{minWidth:Math.max(600,rows.length*145)}} role="img" aria-label="Estimated monthly invoices and purchase orders, excluding VAT">
      {rows.map(row=><div key={row.month} className="finance-chart-column" data-selected={row.month===selected}><div className="finance-chart-bars"><div className="finance-chart-bar finance-chart-estimate" style={{height:height(row.invoice)}} title={`Invoice forecast: ${formatCurrency(row.invoice)}`}/>{!row.projects?<div className="w-[54px] text-center text-[10px] text-muted-foreground">No projects</div>:row.po==null?<div className="finance-chart-unavailable">Unavailable</div>:row.po===0?<div className="w-[54px] border-b-2 border-als-navy pb-1 text-center text-xs font-semibold" title="No uncommitted supplier budget remains">£0</div>:<div className="finance-chart-bar" style={{height:height(row.po)}} title={`PO monthly average: ${formatCurrency(row.po)}${row.missingCosts?' (partial coverage)':''}`}/>}</div><span className="finance-chart-value">Invoice {formatCurrency(row.invoice)}</span><span className="text-xs tabular-nums text-muted-foreground">PO {!row.projects?'No projects':row.po==null?'Unavailable':formatCurrency(row.po)}{row.projects>0&&row.po!=null&&row.missingCosts>0?' · partial':''}</span><span className="finance-chart-month">{monthLabel(row.month)}</span></div>)}
    </div></div>
  </div>;
}