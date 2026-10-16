import React from 'react';
import {Input} from '@/components/ui/input';
import {IE_FINANCE_GROUPS} from '@/components/ie/ieFinanceFields';
export default function IEFinanceFields({value,onChange}){
 return <div className="space-y-6">{IE_FINANCE_GROUPS.map(group=><section key={group.title} className="space-y-3"><h3 className="font-heading text-sm font-bold">{group.title}</h3><div className="grid gap-4 sm:grid-cols-2">{group.fields.map(([key,label])=><label key={key} className="block space-y-2 text-sm"><span>{label} (£)</span><Input type="number" min="0" max="1000000000000" step="0.01" value={value[key]??''} onChange={event=>onChange(key,event.target.value===''?null:Number(event.target.value))}/></label>)}</div></section>)}</div>;
}