import React from 'react';
import { formatCurrency } from '@/lib/portal';
export default function FinanceSummary({data}){
 const cells=[['Power BI sales orders',data.SO==null?'Unavailable':formatCurrency(data.SO)],['Power BI purchase orders',data.PO==null?'Unavailable':formatCurrency(data.PO)],['Source project groups',data.Projects??'Unavailable'],['Missing net values',data.Missing??'Unavailable']];
 return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cells.map(([title,value])=><div key={title} className="rounded-panel border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{title}</p><p className="mt-2 font-heading text-2xl font-semibold">{value}</p></div>)}</div>;
}