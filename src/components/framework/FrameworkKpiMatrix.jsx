import React from 'react';
import {TIME_LABELS,COST_LABELS} from '@/components/framework/frameworkKpiFields';
import '@/components/framework/framework-kpi-matrix.css';
export default function FrameworkKpiMatrix({periods}) {
 const rate=(n,d)=>d?`${Math.round(n/d*100)}% (${n}/${d})`:'Not yet assessed';
 const tiers=[
  ['Milestone Funnel',[['PQ sample',p=>p.pq],['PQ → EA conversion',p=>rate(p.pqToEa,p.pq)],['EA sample',p=>p.ea],['EA → DPA / DMA conversion',p=>rate(p.eaToDpa,p.ea)]]],
  ['Delivery Punctuality',[['Completed-project sample',p=>p.completed],...Object.entries(TIME_LABELS).map(([key,label])=>[label,p=>p.time[key]])]],
  ['Budget Variance',Object.entries(COST_LABELS).map(([key,label])=>[label,p=>p.cost[key]])],
  ['Incident Governance',[['RIDDOR incidents',p=>p.safetyRecords?`${p.incidents} (${p.safetyRecords} project records)`:'Not recorded']]]
 ];
 return <div className="framework-kpi-matrix" aria-label="General KPI period comparison">
  <div className="matrix-head"><div className="matrix-title">General KPI</div>{periods.map(period=><div className="matrix-period" key={period.key}>{period.label}</div>)}</div>
  <div className="matrix-tiers">{tiers.map(([title,rows])=><section className="matrix-tier" key={title}><h3>{title}</h3>{rows.map(([label,value])=><div className="matrix-metric" key={label}><span className="matrix-label">{label}</span>{periods.map(period=>{const text=value(period);return <span key={period.key} className={`matrix-value${text==='Not recorded'?' matrix-muted':''}`} aria-label={`${period.label}: ${text}`}>{text}</span>;})}</div>)}</section>)}</div>
  <div className="matrix-foot">Conversions use PQ and EA signing cohorts within each period, with the next milestone recorded by period end. EA means access agreement; DPA / DMA means signed call-off. Time and cost use live project completion, programme and contract-sum data where held, and refresh when those project records change. Final costs must be recorded; interim valuations are not final costs. The 2026 cumulative period starts 1 January; historical records remain in portfolio headline totals. RIDDOR uses its explicitly recorded calendar reporting year, not an assumed completion year.</div>
 </div>;
}