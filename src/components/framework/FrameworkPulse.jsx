import React from 'react';
import KpiIllustration from '@/components/metrics/KpiIllustration';
import {Layers,Link2,BarChart3} from 'lucide-react';
import FrameworkCommercialFigures from '@/components/framework/FrameworkCommercialFigures';
import FrameworkPulseGraphic from '@/components/framework/FrameworkPulseGraphic';
export default function FrameworkPulse({data}) {
 const items=[['Framework Projects',data.total,Layers],['Linked to ALSight',data.linked,Link2],['Outcomes Recorded',data.outcomes,BarChart3]];
 return <section className="rounded-panel border border-border bg-card p-5 shadow-sm sm:p-6 lg:p-4">
  <header className="mb-6 flex flex-wrap items-center justify-between gap-4 lg:mb-3 lg:gap-2">
   <h2 className="flex items-center gap-2 text-base font-semibold"><Layers className="h-5 w-5"/>Framework360</h2>
   <FrameworkPulseGraphic total={data.total} linked={data.linked}/>
  </header>
  <div className="grid grid-cols-3 gap-3 sm:gap-5">
   {items.map(([label,value,Icon],i)=><div key={label} className={i ? 'alsight-illustrated-kpi min-w-0 border-l border-border pl-3 sm:pl-5' : 'alsight-illustrated-kpi min-w-0'}>
    <KpiIllustration label={label}/>
    <p className="text-4xl font-bold leading-none tracking-tight tabular-nums sm:text-5xl lg:text-4xl">{value?.toLocaleString() ?? '—'}</p>
    <p className="mt-3 text-xs leading-relaxed text-muted-foreground sm:text-sm lg:mt-1.5 lg:text-xs">{label}</p>
   </div>)}
  </div>
  <FrameworkCommercialFigures data={data}/>
 </section>;
}