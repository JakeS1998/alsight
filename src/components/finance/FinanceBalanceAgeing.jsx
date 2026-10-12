import React from 'react';
import {formatCurrency} from '@/lib/portal';
const buckets=['Current','1–30 days','31–60 days','61–90 days','90+ days','No due date'];
export default function FinanceBalanceAgeing({data}){
 return <div className="mt-6 overflow-x-auto"><h3 className="mb-3 font-semibold">Ageing breakdown</h3><table className="w-full text-sm"><thead><tr className="border-b border-border text-muted-foreground"><th className="p-3 text-left">Days overdue</th><th className="p-3 text-right">Creditors</th><th className="p-3 text-right">Debtors</th></tr></thead><tbody>{buckets.map(bucket=><tr key={bucket} className="border-b border-border"><td className="p-3">{bucket}</td>{['creditors','debtors'].map(kind=><td key={kind} className="p-3 text-right tabular-nums">{formatCurrency(data.rows.find(r=>r.Kind===kind&&r.Bucket===bucket)?.Amount||0)}</td>)}</tr>)}</tbody></table></div>;
}