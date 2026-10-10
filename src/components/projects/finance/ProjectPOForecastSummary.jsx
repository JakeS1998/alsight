import React, { useState } from 'react';
import { formatCurrency } from '@/lib/portal';
import { Button } from '@/components/ui/button';
const money = value => value == null ? 'Unavailable' : formatCurrency(value);
export default function ProjectPOForecastSummary({ forecast }) {
 const [limit, setLimit] = useState(12);
 if (!forecast) return null;
 const positive = forecast.available && forecast.remaining > 0;
 const stats = [['Supplier budget', forecast.supplierBudget], ['Recorded PO commitments', forecast.committed], ['Remaining PO budget', forecast.remaining], ['Average additional POs / month', forecast.available ? forecast.monthlyAverage : null]];
 return <div className="rounded-lg border border-border bg-muted p-4 space-y-3">
  <h4 className="font-heading font-semibold">Additional PO forecast</h4>
  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map(([label, value]) => <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold tabular-nums">{money(value)}</p></div>)}</div>
  {forecast.budgetExcess > 0 && <p className="text-sm font-semibold text-destructive">Recorded POs exceed the supplier budget by {money(forecast.budgetExcess)}. Check for revised or superseded orders and confirm the budget; no additional PO spend is forecast.</p>}
  <p className="text-xs text-muted-foreground">{!forecast.available ? 'Forecast unavailable. ' : !positive ? 'No remaining supplier budget, so there is no additional PO forecast line. ' : 'Dashed orange line: recorded money out plus additional POs. '}{forecast.note}</p>
  {positive && <details><summary className="cursor-pointer text-sm font-semibold">Monthly forecast amounts ({forecast.months} months)</summary><div className="mt-3 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border"><th className="py-2 text-left">Month</th><th className="py-2 text-right">Additional POs, excl. VAT</th></tr></thead><tbody>{forecast.rows.slice(0,limit).map(row => <tr key={row.date} className="border-b border-border"><td className="py-2">{new Date(`${row.date}T12:00:00`).toLocaleDateString('en-GB',{month:'short',year:'numeric'})}</td><td className="py-2 text-right tabular-nums">{money(row.amount)}</td></tr>)}</tbody></table></div>{forecast.rows.length>limit && <Button className="mt-3" variant="outline" size="sm" onClick={()=>setLimit(n=>n+12)}>Show more months</Button>}</details>}
 </div>;
}