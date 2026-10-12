import React from 'react';
import FinanceForecastColumn from '@/components/finance/FinanceForecastColumn';
export default function FinanceForecastChart({rows,selected}) {
  const maximum=Math.max(...rows.flatMap(row=>[row.invoice,row.po||0]),1);
  const height=value=>`${value>0?Math.max(2,value/maximum*200):0}px`;
  return <div className="finance-forecast-visual">
    <div className="finance-chart-legend"><span><i className="bg-primary"/>Recorded client invoices</span><span><i className="finance-legend-estimate"/>Invoice forecast (estimate)</span><span><i className="bg-als-navy"/>POs: recorded history / future monthly estimates</span><span>Dashed boxes = unavailable</span></div>
    <p className="mb-3 text-xs text-muted-foreground">Past months show recorded order totals using matched paid dates, or due dates when paid dates are missing; these are not cash receipts. Future months show remaining PO forecast value ÷ remaining programme months. Without a submitted fee proposal, the baseline is estimated project value less current POs. Projects with missing budgets or incomplete PO values are excluded individually, not from the whole month. The PO total includes all available project forecasts, including £0 where no budget remains, and is marked partial when others are missing. Unavailable means no contributing project has a usable PO forecast.</p>
    <div className="overflow-x-auto"><div className="finance-month-chart" style={{minWidth:Math.max(600,rows.length*145)}} role="img" aria-label="Recorded monthly client invoices and purchase orders followed by estimated forecasts">
      {rows.map(row=><FinanceForecastColumn key={row.month} row={row} selected={selected} height={height}/>)}
    </div></div>
  </div>;
}