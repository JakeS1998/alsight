import React from 'react';
import IEPanel from '@/components/ie/IEPanel';
export default function IEWorkSummary({rows=[],kind}){
 const totals=rows.reduce((all,row)=>({count:all.count+row.count,complete:all.complete+(row.status==='complete'?row.count:0),attendees:all.attendees+(row.sum_attendees||0),stakeholders:all.stakeholders+(row.sum_stakeholders||0),responses:all.responses+(row.sum_survey_responses||0)}),{count:0,complete:0,attendees:0,stakeholders:0,responses:0});
 const metrics=kind==='consultation'?[['Activities recorded',totals.count],['Recorded attendance',totals.attendees],['Recorded stakeholders',totals.stakeholders],['Recorded survey responses',totals.responses]]:[['Items recorded',totals.count],['Complete',totals.complete],['Completion',totals.count?`${Math.round(totals.complete/totals.count*100)}%`:'—']];
 return <IEPanel title={kind==='consultation'?'Engagement summary':'Work progress'}><dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">{metrics.map(([label,value])=><div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-2 text-2xl font-bold">{value}</dd></div>)}</dl></IEPanel>;
}