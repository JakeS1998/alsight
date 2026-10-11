import React from 'react';
import {zoneHasRisk} from '@/components/visualiser/prototypeConfig';
export default function VisualiserAreaList({zones,selected,onSelect,layers,records}){
 return <nav aria-label="Select facility area" className="flex flex-wrap gap-2 border-t border-border bg-card p-3">{zones.map(zone=><button key={zone.id} type="button" aria-pressed={selected===zone.id} onClick={()=>onSelect(zone.id)} className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${selected===zone.id?'border-primary bg-primary/15 text-foreground':'border-border bg-card text-muted-foreground hover:bg-muted'}`}><span className={`h-2 w-2 rounded-full ${layers.risks&&zoneHasRisk(zone,records)?'bg-risk-critical':'bg-border'}`}/>{zone.name}</button>)}</nav>;
}