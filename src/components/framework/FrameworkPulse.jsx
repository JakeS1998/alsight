import React from 'react';
import {Layers,Link2,BarChart3} from 'lucide-react';
import {formatCurrency} from '@/lib/portal';
import FrameworkPulseGraphic from '@/components/framework/FrameworkPulseGraphic';
export default function FrameworkPulse({data}) {
 const items=[['Framework Projects',data.total,Layers],['Linked to ALSight',data.linked,Link2],['Outcomes Recorded',data.outcomes,BarChart3]];
 return <section className="rounded-panel border border-border bg-card p-5 shadow-sm sm:p-6">
  <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
   <h2 className="flex items-center gap-2 text-base font-semibold"><Layers className="h-5 w-5"/>Framework360</h2>
   <FrameworkPulseGraphic total={data.total} linked={data.linked}/>
  </header>
  <div className="grid grid-cols-3 gap-3 sm:gap-5">
   {items.map(([label,value,Icon],i)=><div key={label} className={i ? 'min-w-0 border-l border-border pl-3 sm:pl-5' : 'min-w-0'}>
    <Icon className="mb-3 h-5 w-5 text-muted-foreground"/>
    <p className="text-4xl font-bold leading-none tracking-tight tabular-nums sm:text-5xl 2xl:text-6xl">{value?.toLocaleString() ?? '—'}</p>
    <p className="mt-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">{label}</p>
   </div>)}
  </div>
  {data.totalCallOffValue!==undefined && <div className="mt-6 grid gap-5 border-t border-border pt-6 sm:grid-cols-2">
   <div><p className="text-xs text-muted-foreground sm:text-sm">Total Call-Off Value</p><p className="mt-2 break-words text-3xl font-bold leading-tight tracking-tight tabular-nums 2xl:text-4xl">{formatCurrency(data.totalCallOffValue)}</p></div>
   {data.totalUKLFFees!==undefined && <div><p className="text-xs text-muted-foreground sm:text-sm">Total UKLF Fees</p><p className="mt-2 break-words text-3xl font-bold leading-tight tracking-tight text-primary tabular-nums 2xl:text-4xl">{formatCurrency(data.totalUKLFFees)}</p><p className="mt-2 text-xs text-muted-foreground">Recorded access fees</p></div>}
  </div>}
 </section>;
}