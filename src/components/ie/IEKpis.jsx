import React from 'react';
import {Layers,CheckCircle2,BriefcaseBusiness,Link2} from 'lucide-react';
import IEAwaitingActionKpi from '@/components/ie/IEAwaitingActionKpi';
export default function IEKpis({data}){
 const metrics=[
  {label:'Active engagements',value:data?.active,Icon:Layers,note:'Planned and live engagements',tone:'blue'},
  {label:'Completed this year',value:data?.completed,Icon:CheckCircle2,note:`Actual completion · ${data?.year||new Date().getFullYear()}`,tone:'green'},
  {label:'Total engagements',value:data?.total,Icon:BriefcaseBusiness,note:'All recorded I&E engagements',tone:'blue'},
  {label:'Client-linked engagements',value:data?.clientLinked,Icon:Link2,note:'Matched to an ALSight client',tone:'orange'}
 ];
 return <section aria-label="Engagement headline indicators" className="ie-metrics"><IEAwaitingActionKpi data={data}/>{metrics.map(({label,value,Icon,note,tone})=><article key={label} className="ie-metric"><span className={`ie-metric-icon ie-tone-${tone}`}><Icon strokeWidth={1.7}/></span><div><p className="ie-metric-label">{label}</p><p className="ie-metric-value">{value==null?'—':value.toLocaleString('en-GB')}</p><p className="ie-metric-note">{note}</p></div></article>)}</section>;
}