import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ClipboardCheck, ShieldCheck, ChartNoAxesCombined } from 'lucide-react';
import AdaptiveAttentionMetric from '@/components/adaptive/AdaptiveAttentionMetric';
export default function AdaptiveMetrics({data,calendar,onSelect,actions=[]}) {
 const metrics=[
  {label:'Diary events today',value:calendar.loading?'…':calendar.error?'—':`${calendar.rows.length}${calendar.more?'+':''}`,note:calendar.error?'Outlook unavailable':calendar.more?'Partial Outlook diary':'Recorded Outlook invitations',icon:CalendarDays,tone:'diary',view:'diary'},
  {label:'Assigned tasks',value:data.taskTotal??'—',note:'Open work assigned to you',icon:ClipboardCheck,tone:'tasks',view:'tasks'},
  {label:'Pending approvals',value:data.totals?.approvals??'—',note:'Within your existing access',icon:ShieldCheck,tone:'approvals',to:'/approvals'},
  {label:'Active projects',value:data.projectTotal??'—',note:'Accessible live projects · reference',icon:ChartNoAxesCombined,tone:'projects',view:'projects'}
 ];
 return <section className="at-metrics" aria-label="Your working day at a glance"><AdaptiveAttentionMetric data={data} actions={actions} onSelect={onSelect}/>{metrics.map(({label,value,note,icon:Icon,tone,to,view})=>{const content=<><span className="at-metric-icon"><Icon size={23}/></span><span><strong>{value}</strong><span className="at-metric-label">{label}</span><small>{note}</small></span></>;return view?<button type="button" key={label} className="at-metric" data-tone={tone} aria-haspopup="dialog" onClick={()=>onSelect(view)}>{content}</button>:<Link key={label} className="at-metric" data-tone={tone} to={to}>{content}</Link>;})}</section>;
}