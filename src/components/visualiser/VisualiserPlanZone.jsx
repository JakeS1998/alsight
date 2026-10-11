import React from 'react';
import {zoneHasRisk,statusStyles} from '@/components/visualiser/prototypeConfig';
export default function VisualiserPlanZone({zone,selected,onSelect,layers,records}){
 const risk=layers.risks&&zoneHasRisk(zone,records),active=selected===zone.id;
 return <g role="button" tabIndex={0} aria-label={`${zone.name}, status not recorded${risk?', linked open risk':''}`} aria-pressed={active} onClick={()=>onSelect(zone.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(zone.id);}}} className="cursor-pointer outline-none group">
 <rect x={zone.x+.25} y={zone.y+.25} width={zone.w-.5} height={zone.d-.5} className={`${active?statusStyles.selected:risk?statusStyles.risk:statusStyles.unknown} stroke-foreground/60 group-focus:stroke-primary`} strokeWidth={active ? .28 : .12}/>
 {zone.kind==='pool'&&<><rect x={zone.x+4} y={zone.y+3} width={zone.w-8} height={zone.d-6} className="fill-chart-4/35 stroke-als-navy-light/50" strokeWidth=".12"/>{[1,2,3,4,5].map(i=><path key={i} d={`M ${zone.x+4} ${zone.y+3+i*2} h ${zone.w-8}`} className="stroke-als-navy-light/30" strokeWidth=".08" strokeDasharray=".3 .2"/>)}</>}
 {zone.kind==='plant'&&[1,2,3].map(i=><circle key={i} cx={zone.x+2+i*2.3} cy={zone.y+5} r=".9" className="fill-card stroke-foreground/40" strokeWidth=".12"/>)}
 {layers.areas&&<text x={zone.x+zone.w/2} y={zone.y+zone.d/2} textAnchor="middle" dominantBaseline="middle" className="fill-foreground font-body font-medium" fontSize={zone.w<14?'.8':'1'}>{zone.name}</text>}
 {risk&&<g><circle cx={zone.x+1.3} cy={zone.y+1.3} r=".65" className="fill-risk-critical"/><text x={zone.x+1.3} y={zone.y+1.55} textAnchor="middle" className="fill-card" fontSize=".8">!</text></g>}
 {active&&<rect x={zone.x+.25} y={zone.y+.25} width={zone.w-.5} height={zone.d-.5} fill="none" className="stroke-primary" strokeWidth=".3"/>}
 </g>;
}