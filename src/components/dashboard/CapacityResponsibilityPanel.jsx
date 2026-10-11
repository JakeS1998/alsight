import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import CapacityResponsibilityDetail from '@/components/dashboard/CapacityResponsibilityDetail';
const tones={Balanced:'bg-secondary text-foreground',Concentrated:'bg-primary/20 text-foreground','Potential dependency':'bg-primary/50 text-foreground','Insufficient information':'bg-muted text-muted-foreground'};
export default function CapacityResponsibilityPanel({data,role,options}) {
  const [selected,setSelected]=useState(null);
  return <section className="space-y-2"><h3 className="text-sm font-semibold">{role==='bdm' ? 'BDM commercial responsibility' : 'BSM business support responsibility'}</h3><p className="text-xs text-muted-foreground">{role==='bdm' ? 'Total project ownership and active pipeline across the organisation; value is unweighted.' : 'Supported projects and linked administration, not personally assigned approval tasks.'} {data.missing} projects have no recorded {role.toUpperCase()}.</p>
    {!data.owners.length ? <p className="text-xs text-muted-foreground">Insufficient information: no recorded responsibilities in this selection.</p> : <div className="max-h-64 space-y-2 overflow-y-auto p-1">{data.owners.map(owner=><details key={owner.key} open={selected===owner.key} className="group rounded-md border border-border bg-card p-2">
      <summary onClick={event=>{event.preventDefault();setSelected(value=>value===owner.key ? null : owner.key);}} className="flex cursor-pointer list-none items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden"><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold" title={owner.name}>{owner.name}</p><p className="mt-1 text-xs text-muted-foreground">{owner.projects} projects{role==='bdm' ? ` · ${owner.opportunities} opportunities` : ` · ${owner.administration} documents`}</p></div><span className={`rounded-md px-2 py-1 text-xs ${tones[owner.classification]}`}>{owner.classification}</span><ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-open:rotate-180" aria-hidden="true"/></summary>
      {selected===owner.key && <CapacityResponsibilityDetail owner={owner} role={role} options={options}/>}
    </details>)}</div>}
  </section>;
}