import React from 'react';
import {Link} from 'react-router-dom';
import {ArrowUpRight,Clock3} from 'lucide-react';
import {formatDate} from '@/lib/portal';
import useListState from '@/components/navigation/useListState';
export default function IEAwaitingActionKpi({data}){
 const items=data?.needs||[],[,setFilters]=useListState('filters',{});
 const viewAll=()=>{setFilters({attention:true});document.getElementById('ie-engagement-register')?.scrollIntoView({block:'start'});};
 return <article className="ie-metric ie-awaiting-action">
  <header className="ie-awaiting-summary"><span className="ie-metric-icon"><Clock3 strokeWidth={1.7}/></span><div><h2 className="ie-metric-label">Awaiting action</h2><p className="ie-metric-value">{data?.awaiting==null?'—':data.awaiting.toLocaleString('en-GB')}</p><p className="ie-metric-note">Outstanding actions or upcoming targets</p></div></header>
  <ul className="ie-awaiting-list" aria-label="Engagements awaiting action">{items.map(item=>{
   const hasAction=item.awaiting_action,tab=hasAction?'overview':'timeline',anchor=hasAction?'ie-awaiting-action':'ie-target-completion';
   const note=hasAction?(item.action_note||'Review outstanding action'):item.target_date?`Target completion · ${formatDate(item.target_date)}`:'Review upcoming target';
   return <li key={item.id}><Link to={`/insights-engagement/${item.id}?tab=${tab}#${anchor}`} className="ie-awaiting-link"><span className="min-w-0"><strong>{item.project_name||item.name}</strong>{item.project_name&&item.project_name!==item.name&&<span className="ie-awaiting-context">{item.name}</span>}<span className="ie-awaiting-note">{note}</span></span><ArrowUpRight className="h-4 w-4 shrink-0"/></Link></li>;
  })}</ul>
  {!items.length&&<p className="ie-awaiting-empty">Nothing needs attention right now.</p>}
  {!!items.length&&<button type="button" className="ie-awaiting-all" onClick={viewAll}>View all awaiting action <ArrowUpRight className="h-3.5 w-3.5"/></button>}
 </article>;
}