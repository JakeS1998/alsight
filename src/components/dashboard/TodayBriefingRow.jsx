import React from 'react';
import { Link } from 'react-router-dom';
const tones={urgent:'bg-destructive',attention:'bg-primary',upcoming:'bg-success',contact:'bg-chart-2'};
export default function TodayBriefingRow({ item, role }) {
 const canAddAction=['admin','director','bdm','bsm'].includes(role) && item.task==='action' && item.project;
 const ask=()=>window.dispatchEvent(new CustomEvent('alsight-open-alice',{detail:{prompt:`Today briefing: ${item.title}. ${item.detail}. Help me review this recorded item and prepare a follow-up. ${item.project ? `Project ID: ${item.project.id}.` : ''} Do not invent facts or change records without my confirmation.`,autoSend:true}}));
 const add=()=>window.dispatchEvent(new CustomEvent('alsight-open-alice',{detail:{task:'action',project:item.project}}));
 return <li className="flex items-start gap-3 rounded-lg border border-border p-3"><span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${tones[item.severity]}`} aria-hidden="true"/><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.detail}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold"><Link to={item.to} className="text-chart-2 underline underline-offset-2">{item.label} →</Link>{canAddAction && <button onClick={add} className="text-chart-2 underline underline-offset-2">Add action with ALICE →</button>}<button onClick={ask} className="text-chart-2 underline underline-offset-2">Ask ALICE →</button></div></div></li>;
}