import {powerToken,powerQuery} from './financePowerBI.ts';
import {orderDateVariables} from './powerBIOrderDateDax.ts';
const literal=value=>`"${String(value).replace(/"/g,'""')}"`;
function historyDax(rows,first,last){
 const values=rows.map(r=>`{${literal(String(r.reference||'').trim().toUpperCase())},${literal(r.kind)},${literal(r.projectId)},${Number.isFinite(r.sum_amount)?r.sum_amount:0},${r.has_amount?0:r.count}}`).join(',');
 const t="'crf00_transaction_tb'";
 return `EVALUATE VAR dated=GENERATE(DATATABLE("OrderReference",STRING,"Kind",STRING,"Project",STRING,"OrderAmount",DOUBLE,"Missing",INTEGER,{${values}}),VAR ref=[OrderReference] ${orderDateVariables()} VAR paid=MAXX(matched,${t}[Paid date]) VAR due=MINX(matched,${t}[Due date]) VAR datedAt=COALESCE(paid,due) RETURN ROW("Month",IF(ISBLANK(datedAt),BLANK(),FORMAT(datedAt,"yyyy-MM")),"DueFallback",IF(ISBLANK(paid)&&NOT(ISBLANK(due)),1,0))) VAR selected=FILTER(dated,ISBLANK([Month])||([Month]>=${literal(first)}&&[Month]<=${literal(last)})) RETURN GROUPBY(selected,[Month],[Kind],[Project],"Amount",SUMX(CURRENTGROUP(),[OrderAmount]),"Records",COUNTX(CURRENTGROUP(),1),"MissingValues",SUMX(CURRENTGROUP(),[Missing]),"DueFallback",SUMX(CURRENTGROUP(),[DueFallback]))`;
}
export async function forecastHistory(base44,state,projects,first,last){
 if(!state?.active_generation||state.source!=='powerbi')return {available:false,rows:[],missingDates:0,missingValues:0};
 const owners=new Map(projects.flatMap(p=>p.sourceKeys.map(key=>[key,p.id]))),keys=[...owners.keys()];
 const groups=[];
 // Only links derived from the caller's accessible projects enter the shared model query.
 for(let i=0;i<keys.length;i+=100){
  const result=await base44.entities.FinanceDataverseRecord.aggregate({query:{namespace:state.namespace,generation:state.active_generation,active:true,project_key:{$in:keys.slice(i,i+100)},kind:{$in:['sales_orders','purchase_orders']}},groupBy:['project_key','reference','kind','has_amount'],sum:'amount',limit:1000});
  if(result.truncated)throw new Error('Historical order grouping exceeds the reporting limit. Narrow the project search; partial totals are not displayed.');
  groups.push(...result.rows.map(r=>({...r,projectId:owners.get(r.project_key)})));
 }
 if(!groups.length)return {available:true,rows:[],missingDates:0,missingValues:0};
 if(groups.some(r=>String(r.reference||'').length>250))throw new Error('Historical order reference exceeds the reporting limit.');
 const token=await powerToken(base44),rows=[];
 for(let i=0;i<groups.length;i+=300){
  const batch=groups.slice(i,i+300),queries=[];
  for(let j=0;j<batch.length;j+=100)queries.push(powerQuery(token,state.dataset_id,historyDax(batch.slice(j,j+100),first,last)));
  rows.push(...(await Promise.all(queries)).flat());
 }
 return {available:true,rows:rows.filter(r=>r.Month),missingDates:rows.filter(r=>!r.Month).reduce((n,r)=>n+r.Records,0),missingValues:rows.reduce((n,r)=>n+r.MissingValues,0)};
}
export function historicalMonth(history,month){
 const rows=history.rows.filter(r=>r.Month===month),invoice=rows.filter(r=>r.Kind==='sales_orders'),po=rows.filter(r=>r.Kind==='purchase_orders');
 const amount=rows=>!history.available||rows.some(r=>r.MissingValues>0)?null:rows.reduce((n,r)=>n+Math.round(r.Amount*100),0)/100;
 return {invoice:amount(invoice),po:amount(po),projects:new Set(rows.map(r=>r.Project)).size,missingCosts:po.reduce((n,r)=>n+r.MissingValues,0),invoiceBaselines:0,dueDateFallback:rows.reduce((n,r)=>n+r.DueFallback,0),recorded:history.available};
}