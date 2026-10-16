import React from 'react';
import { Link } from 'react-router-dom';
import { Pin, EyeOff, ArrowUp, ArrowDown, ArrowUpRight } from 'lucide-react';
import AdaptiveProjectCards from '@/components/adaptive/AdaptiveProjectCards';
export const widgetTitles={projects:'My active projects',documents:'Document attention',approvals:'My outstanding approvals',commercial:'Commercial follow-through',activity:'Recent project activity',opportunities:'My open opportunities'};
export default function WorkspaceWidget({id,rows,href,prefs,index,order,note}) {
 const pinned=prefs.config.pinned.includes(id);
 return <article id={`adaptive-widget-${id}`} tabIndex={-1} className="at-widget scroll-mt-28" data-widget={id}><header><h3>{widgetTitles[id]}</h3><div className="at-widget-controls"><button className="at-icon-button" aria-label={`${pinned?'Unpin':'Pin'} ${widgetTitles[id]}`} aria-pressed={pinned} onClick={()=>prefs.toggle('pinned',id)}><Pin size={14}/></button><button className="at-icon-button" disabled={index===0||prefs.config.pinned.includes(order[index-1])!==pinned} aria-label={`Move ${widgetTitles[id]} up`} onClick={()=>prefs.move(id,-1,order)}><ArrowUp size={14}/></button><button className="at-icon-button" disabled={index===order.length-1||prefs.config.pinned.includes(order[index+1])!==pinned} aria-label={`Move ${widgetTitles[id]} down`} onClick={()=>prefs.move(id,1,order)}><ArrowDown size={14}/></button><button className="at-icon-button" aria-label={`Hide ${widgetTitles[id]}`} onClick={()=>prefs.toggle('hidden',id)}><EyeOff size={14}/></button></div></header>
  {note&&<p className="at-small">{note}</p>}{rows.length?(id==='projects'?<AdaptiveProjectCards rows={rows}/>:<ul>{rows.slice(0,4).map(row=><li key={row.key||row.id||row.to}><Link to={row.to}>{row.title}<ArrowUpRight size={14}/></Link>{row.detail&&<p>{row.detail}</p>}</li>)}</ul>):<p className="at-widget-empty">No matching records in this workspace’s loaded context.</p>}
  {href&&<Link className="at-text-link at-widget-footer" to={href}>Open workspace <ArrowUpRight size={14}/></Link>}
 </article>;
}