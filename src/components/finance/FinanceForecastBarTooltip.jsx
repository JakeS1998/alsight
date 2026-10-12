import React from 'react';
import {Tooltip, TooltipTrigger, TooltipContent} from '@/components/ui/tooltip';
import {formatCurrency} from '@/lib/portal';
import {monthLabel} from '@/components/finance/FinanceForecastMonths';
export default function FinanceForecastBarTooltip({row,type,children}) {
 const invoices=type==='Invoices',amount=invoices?row.invoice:row.po;
 const actual=invoices?row.actualInvoice:row.actualPo,forecast=invoices?row.forecastInvoice:row.forecastPo;
 const basis=row.current?'Actual + forecast':row.historical?'Recorded':'Forecast';
 const money=value=>value==null?'Unavailable':formatCurrency(value);
 const label=invoices?'Client invoices':'Purchase orders';
 return <Tooltip><TooltipTrigger asChild><div tabIndex={0} aria-label={`${monthLabel(row.month)} ${label}: ${money(amount)}, ${basis}`} className="flex min-h-2 w-[54px] items-end justify-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{children}</div></TooltipTrigger>
  <TooltipContent className="max-w-xs border border-border bg-popover p-3 text-popover-foreground shadow-md">
   <p className="font-semibold">{monthLabel(row.month)} · {label}</p>
   <p className="mt-1 text-muted-foreground">{basis}</p>
   <p className="mt-2 font-semibold tabular-nums">Total: {money(amount)}</p>
   {row.current&&<div className="mt-2 space-y-1 tabular-nums"><p>Actual: {money(actual)}</p><p>Forecast: {money(forecast)}</p></div>}
   {!invoices&&!row.historical&&row.projects>0&&amount!=null&&row.missingCosts>0&&<p className="mt-2 text-muted-foreground">Partial coverage</p>}
   {!invoices&&!row.historical&&!row.current&&!row.projects&&<p className="mt-2 text-muted-foreground">No projects</p>}
  </TooltipContent>
 </Tooltip>;
}