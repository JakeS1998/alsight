import React from 'react';
import {Button} from '@/components/ui/button';
import SlidingTabHighlight from '@/components/navigation/SlidingTabHighlight';
export default function FinanceBalanceToggle({value,onChange}) {
 return <div role="group" aria-label="Creditors or debtors" className="finance-balance-toggle sliding-tab-list flex gap-1 rounded-lg border border-border p-1">
  <SlidingTabHighlight/>
  {['creditors','debtors'].map(kind=><Button key={kind} type="button" aria-pressed={value===kind} variant="ghost" onClick={()=>onChange(kind)}><span className="sliding-tab-label">{kind==='creditors'?'Creditors':'Debtors'}</span></Button>)}
 </div>;
}