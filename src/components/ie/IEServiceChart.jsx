import React from 'react';
import {ArrowRight,BarChart3} from 'lucide-react';
export default function IEServiceChart({services=[],classifications=[],onFilter}){
 const largest=Math.max(1,...services.map(s=>s.count));
 const sorted=[...services].sort((a,b)=>b.count-a.count);
 const colors=['hsl(var(--chart-2))','hsl(var(--primary))','hsl(var(--chart-4))','hsl(var(--success))','hsl(var(--chart-5))','hsl(var(--muted-foreground))'];
 return <section className="ie-dashboard-panel ie-service-panel"><header className="ie-panel-heading"><h2>Engagements by service type</h2><span className="ie-period-label">All engagements</span></header><div className="ie-service-bars">{sorted.map((service,i)=>{const name=classifications.find(c=>c.id===service.id)?.name||'Not classified';return <button key={service.id||'unclassified'} type="button" className="ie-service-row" onClick={()=>onFilter({category_id:service.id||'',...(service.id?{}:{unclassified:true})})} aria-label={`View ${service.count} ${name} engagements`}><span title={name}>{name}</span><span className="ie-bar-track"><span style={{width:`${service.count/largest*100}%`,backgroundColor:colors[i%colors.length]}}/></span><strong>{service.count}</strong><ArrowRight className="ie-bar-arrow"/></button>;})}{!sorted.length&&<div className="ie-chart-empty"><BarChart3/><p>No service data yet.</p></div>}</div></section>;
}