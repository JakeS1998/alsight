import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
export default function FinanceSourceFields({type,value,onChange}){
 const fields=[['table','Model table'],['project','Project-name column'],['code','Project-code column (optional)'],['reference','Order-reference column'],['value','Net-value column (GBP, excluding VAT)']];
 return <fieldset className="rounded-panel border border-border bg-card p-5"><legend className="px-2 font-heading font-semibold">{type==='SO'?'Sales orders':'Purchase orders'}</legend><div className="grid gap-4 sm:grid-cols-2">{fields.map(([key,label])=><div key={key}><Label htmlFor={`${type}-${key}`}>{label}</Label><Input id={`${type}-${key}`} value={value?.[key]||''} required={key!=='code'} maxLength={120} onChange={e=>onChange({...value,[key]:e.target.value})}/></div>)}</div></fieldset>;
}