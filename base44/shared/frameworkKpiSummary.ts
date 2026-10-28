import {kpiYesNo,kpiMoney,kpiCounts} from './frameworkKpiRules.ts';
const start2026='2026-01-01',money=['local_spend','local_spend_target','welsh_spend','welsh_spend_target'],social=['school_visits','school_visits_target','apprenticeships','apprenticeships_target','consultation_events','consultation_events_target','jobs_created','jobs_created_target','population_impact'];
export async function frameworkKpiSummary(source,scope,year) {
 const periods=[{key:'cumulative',label:'2026 onwards',start:start2026,end:`${new Date().getFullYear()+1}-01-01`},{key:'annual',label:String(year),start:`${year}-01-01`,end:`${year+1}-01-01`}];
 const q=(...parts)=>({$and:[scope,...parts]}),dated=(field,period)=>({[field]:{$gte:period.start,$lt:period.end}});
 const taskEntries=[];
 for(const p of periods) {
  const completed=q(dated('actual_completion_date',p));
  taskEntries.push([`${p.key}:delivery`,()=>source.aggregate({query:completed,groupBy:['time_category','cost_category'],sum:[...money,...social],limit:1000})]);
  taskEntries.push([`${p.key}:safety`,()=>source.aggregate({query:q({riddor_reporting_year:p.key==='annual' ? year : {$gte:2026,$lte:new Date().getFullYear()}},{riddor_incidents:{$gte:0}}),sum:'riddor_incidents'})]);
  taskEntries.push([`${p.key}:pq`,()=>source.count(q(dated('pq_date',p)))]);
  taskEntries.push([`${p.key}:pqToEa`,()=>source.count(q(dated('pq_date',p),{aa_signed:{$gte:'0001-01-01',$lt:p.end}}))]);
  taskEntries.push([`${p.key}:ea`,()=>source.count(q(dated('aa_signed',p)))]);
  taskEntries.push([`${p.key}:eaToDpa`,()=>source.count(q(dated('aa_signed',p),{calloff_date:{$gte:'0001-01-01',$lt:p.end}}))]);
 }

 taskEntries.push(['coverage',()=>source.count(q({kpis_complete:true}))]);
 taskEntries.push(['populationCoverage',()=>source.count(q({population_impact:{$gte:0},population_source_url:{$gt:''}}))]);
 // Full-portfolio social totals, including projects still in delivery, are computed on the server.
 taskEntries.push(['socialTotals',()=>source.aggregate({query:scope,sum:[...money,...social]})]);
 taskEntries.push(['total',()=>source.count(scope)]);
 for(const field of [...money,...social])taskEntries.push([`socialCoverage:${field}`,()=>source.count(q({[field]:{$gte:0}}))]);
 const results={};for(let i=0;i<taskEntries.length;i+=3)await Promise.all(taskEntries.slice(i,i+3).map(async([key,run])=>{results[key]=await run();if(results[key]?.truncated)throw new Error('KPI summary exceeds its reporting limit.');}));
 const periodRows=periods.map(p=>{const rows=results[`${p.key}:delivery`].rows || [],sum=field=>rows.reduce((total,row)=>total+(row[`sum_${field}`] || 0),0);return {...p,pq:results[`${p.key}:pq`],pqToEa:results[`${p.key}:pqToEa`],ea:results[`${p.key}:ea`],eaToDpa:results[`${p.key}:eaToDpa`],completed:rows.reduce((n,r)=>n+r.count,0),time:Object.fromEntries(['on_time','late_7_28','late_over_28'].map(key=>[key,rows.filter(r=>r.time_category===key).reduce((n,r)=>n+r.count,0)])),cost:Object.fromEntries(['within_budget','over_within_10','over_10'].map(key=>[key,rows.filter(r=>r.cost_category===key).reduce((n,r)=>n+r.count,0)])),incidents:results[`${p.key}:safety`].rows?.[0]?.sum_riddor_incidents ?? 0,safetyRecords:results[`${p.key}:safety`].rows?.[0]?.count ?? 0,social:Object.fromEntries([...money,...social].map(field=>[field,sum(field)]))};});

 return {socialCoverage:Object.fromEntries([...money,...social].map(field=>[field,results[`socialCoverage:${field}`]])),periods:periodRows,total:results.total,complete:results.coverage,populationCoverage:results.populationCoverage,socialTotals:results.socialTotals.rows?.[0] || {},asOf:new Date().toISOString()};
}