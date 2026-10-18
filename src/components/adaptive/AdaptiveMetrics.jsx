import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarDays, ClipboardCheck, ShieldCheck, ChartNoAxesCombined } from 'lucide-react';
export default function AdaptiveMetrics({data,calendar,onSelect}) {
 const metrics=[
  {label:'Requiring attention',value:data.priorityTotal??'—',note:'Actions, awareness and waiting items',icon:AlertTriangle,tone:'attention',view:'attention'},
  {label:'Diary events today',value:calendar.loading?'…':calendar.error?'—':`${calendar.rows.length}${calendar.more?'+':''}`,note:calendar.error?'Outlook unavailable':calendar.more?'Partial Outlook diary':'Recorded Outlook invitations',icon:CalendarDays,tone:'diary',view:'diary'},
  {label:'Assigned tasks',value:data.taskTotal??'—',note:'Open work assigned to you',icon:ClipboardCheck,tone:'tasks',view:'tasks'},
  {label:'Pending approvals',value:data.totals?.approvals??'—',note:'Within your existing access',icon:ShieldCheck,tone:'approvals',to:'/approvals'},
  {label:'Active projects',value:data.projectTotal??'—',note:'Accessible live projects · reference',icon:ChartNoAxesCombined,tone:'projects',view:'projects'}
 ];
 return <section className="at-metrics" aria-label="Your working day at a glance">{metrics.map(({label,value,note,icon:Icon,tone,to,view})=>{const content=<><span className="at-metric-icon"><Icon size={23}/></span><span><strong>{value}</strong><span className="at-metric-label">{label}</span><small>{note}</small></span></>;return view?<button type="button" key={label} className="at-metric" data-tone={tone} aria-haspopup="dialog" onClick={()=>onSelect(view)}>{content}</button>:<Link key={label} className="at-metric" data-tone={tone} to={to}>{content}</Link>;})}</section>;
}