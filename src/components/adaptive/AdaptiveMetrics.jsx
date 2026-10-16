import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarDays, ClipboardCheck, ShieldCheck, ChartNoAxesCombined } from 'lucide-react';
export default function AdaptiveMetrics({data,calendar}) {
 const metrics=[
  {label:'Requiring attention',value:data.priorityTotal??'—',note:'Across available sources',icon:AlertTriangle,tone:'attention',to:'#adaptive-priorities'},
  {label:'Diary events today',value:calendar.loading?'…':calendar.error?'—':`${calendar.rows.length}${calendar.more?'+':''}`,note:calendar.error?'Outlook unavailable':'Loaded Outlook events',icon:CalendarDays,tone:'diary',to:'#adaptive-day'},
  {label:'Assigned tasks',value:data.taskTotal??'—',note:'Open across available sources',icon:ClipboardCheck,tone:'tasks',to:'#adaptive-priorities'},
  {label:'Pending approvals',value:data.totals?.approvals??'—',note:'Within your existing access',icon:ShieldCheck,tone:'approvals',to:'/approvals'},
  {label:'Active projects',value:data.projectTotal??'—',note:'Accessible live projects',icon:ChartNoAxesCombined,tone:'projects',to:'/projects'}
 ];
 return <section className="at-metrics" aria-label="Your working day at a glance">{metrics.map(({label,value,note,icon:Icon,tone,to})=>{const content=<><span className="at-metric-icon"><Icon size={23}/></span><span><strong>{value}</strong><span className="at-metric-label">{label}</span><small>{note}</small></span></>;return to.startsWith('#')?<a key={label} className="at-metric" data-tone={tone} href={to}>{content}</a>:<Link key={label} className="at-metric" data-tone={tone} to={to}>{content}</Link>;})}</section>;
}