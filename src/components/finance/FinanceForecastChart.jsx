import React from 'react';
import { formatCurrency } from '@/lib/portal';
import { monthLabel } from '@/components/finance/FinanceForecastMonths';
export default function FinanceForecastChart({rows,selected}) {
  const maximum=Math.max(...rows.flatMap(row=>[row.invoice,row.po||0]),1);
  const height=value=>`${value>0?Math.max(2,value/maximum*200):0}px`;
  return <div className="finance-forecast-visual">
    <div className="finance-chart-legend"><span><i className="finance-legend-estimate"/>Invoice forecast (estimate)</span><span><i className="finance-legend-po"/>PO forecast (estimate); dashed = Unavailable</span></div>
    <div className="overflow-x-auto"><div className="finance-month-chart" style={{minWidth:Math.max(600,rows.length*145)}} role="img" aria-label="Estimated monthly invoices and purchase orders, excluding VAT">
      {rows.map(row=><div key={row.month} className="finance-chart-column" data-selected={row.month===selected}><div className="finance-chart-bars"><div className="finance-chart-bar finance-chart-estimate" style={{height:height(row.invoice)}} title={`Invoice forecast: ${formatCurrency(row.invoice)}`}/>{row.po==null?<div className="finance-chart-unavailable">Unavailable</div>:<div className="finance-chart-bar" style={{height:height(row.po)}} title={`PO forecast: ${formatCurrency(row.po)}`}/>}</div><span className="finance-chart-value">{formatCurrency(row.invoice)}</span><span className="finance-chart-month">{monthLabel(row.month)}</span></div>)}
    </div></div>
  </div>;
}