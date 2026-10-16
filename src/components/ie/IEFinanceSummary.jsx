import React from 'react';
import {IE_FINANCE_GROUPS} from '@/components/ie/ieFinanceFields';
import {ieMoney} from '@/components/ie/ieWorkConfig';
export default function IEFinanceSummary({item}){
 return <div className="space-y-6">{IE_FINANCE_GROUPS.map(group=><section key={group.title}><h3 className="mb-4 font-heading text-sm font-bold">{group.title}</h3><dl className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{group.fields.map(([key,label])=><div key={key} className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-2 break-words text-xl font-bold tabular-nums">{ieMoney(item?.[key])}</dd></div>)}</dl></section>)}</div>;
}