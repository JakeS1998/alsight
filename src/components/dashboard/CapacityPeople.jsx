import React, { useId } from 'react';
import CapacitySupplierDetail from '@/components/dashboard/CapacitySupplierDetail';
const tones={Balanced:'bg-chart-2/10 text-foreground',Elevated:'bg-primary/20 text-foreground',Concentrated:'bg-primary/50 text-foreground','Insufficient information':'bg-muted text-muted-foreground'};
export default function CapacityPeople({people,onSelect,selected}) {
  const detailId=useId();
  const concerns=people.filter(person=>['Elevated','Concentrated'].includes(person.classification)).sort((a,b)=>b.active-a.active || a.name.localeCompare(b.name)).slice(0,9);
  const supplier=concerns.find(person=>person.key===selected);
  if(!concerns.length)return <p className="text-sm text-muted-foreground">No elevated or concentrated supplier workloads in this view.</p>;
  return <div className="space-y-3">
    <p className="text-xs text-muted-foreground">Top nine suppliers with elevated or concentrated workloads, ranked by active projects. Select a supplier for details.</p>
    <div className="grid grid-cols-2 gap-2 p-1 sm:grid-cols-3" aria-label="Delivery supplier workload heatmap">
      {concerns.map(person=><button type="button" key={person.key} onClick={()=>onSelect(selected===person.key ? null : person.key)} aria-expanded={selected===person.key} aria-controls={selected===person.key ? detailId : undefined} aria-label={`${person.name}: ${person.active} active projects, ${person.classification}. ${selected===person.key ? 'Collapse' : 'Expand'} details.`} title={`${person.name} · ${person.classification}`} className={`flex min-h-20 flex-col justify-between rounded-md border p-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${tones[person.classification] || tones['Insufficient information']} ${selected===person.key ? 'border-foreground ring-2 ring-foreground/30' : 'border-border hover:border-foreground/50'}`}>
        <span className="line-clamp-2 text-xs font-medium leading-tight">{person.name}</span><span className="mt-1 text-lg font-semibold leading-none">{person.active}</span>
      </button>)}
    </div>
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground" aria-label="Workload signal legend">{Object.entries(tones).filter(([label])=>['Elevated','Concentrated'].includes(label)).map(([label,tone])=><span key={label} className="inline-flex items-center gap-1"><span className={`h-2.5 w-2.5 rounded-sm border border-border ${tone}`} aria-hidden="true"/>{label}</span>)}</div>
    {supplier && <CapacitySupplierDetail id={detailId} supplier={supplier} onClose={()=>onSelect(null)}/>}
  </div>;
}