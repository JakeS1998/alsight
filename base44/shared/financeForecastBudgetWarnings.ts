import {powerToken,powerQuery} from './financePowerBI.ts';
import {mainProjectNumber} from './financeProjectNumberGroups.ts';
import {financeTransactionRowsDax} from './financeTransactionRowsDax.ts';
const literal=value=>`"${String(value).replace(/"/g,'""')}"`;
export async function financeForecastBudgetWarnings(base44,state,items){
 if(state?.source!=='powerbi'||!state.active_generation)return items;
 const selected=items.filter(p=>!p.reason&&p.supplierBudget!=null&&p.sourceKeys.length);
 const ids=selected.map(p=>p.id),keys=selected.flatMap(p=>p.sourceKeys);
 const spent=new Map();
 if(ids.length){
  const mappings=await base44.entities.FinanceProjectMapping.aggregate({query:{dataset_id:state.namespace,project_id:{$in:ids},source_key:{$in:keys},status:{$in:['automatic','manual']}},groupBy:['project_id','source_code'],limit:1000});
  if(mappings.truncated)throw new Error('Supplier transaction links exceed the reporting limit. Partial budget warnings are not displayed.');
  const links=mappings.rows.flatMap(m=>[...new Set([m.source_code,mainProjectNumber(m.source_code)].filter(Boolean))].map(code=>({owner:m.project_id,code})));
  if(links.length){
   const owners=[...new Set(links.map(l=>l.owner))];
   const codeRows=links.map(l=>`{${literal(l.owner)},${literal(l.code)}}`).join(',');
   const ownerRows=owners.map(id=>`{${literal(id)}}`).join(',');
   const costs=financeTransactionRowsDax('codes',true);
   const query=`EVALUATE VAR links=DATATABLE("Owner",STRING,"Code",STRING,{${codeRows}}) RETURN GENERATE(DATATABLE("Project",STRING,{${ownerRows}}),VAR ownerId=[Project] VAR codes=SELECTCOLUMNS(FILTER(links,[Owner]=ownerId),"Code",[Code]) VAR costs=${costs} RETURN ROW("Amount",COALESCE(SUMX(costs,[Amount]),0),"MissingValues",COUNTROWS(FILTER(costs,ISBLANK([Amount])))))`;
   const rows=await powerQuery(await powerToken(base44),state.dataset_id,query);
   for(const row of rows)spent.set(row.Project,row);
  }
 }
 return items.map(p=>{
  if(p.reason)return p;
  const row=spent.get(p.id),amount=row&&Number.isFinite(row.Amount)&&row.MissingValues===0?row.Amount:null;
  return {...p,budgetWarningBasis:'transactions',supplierSpend:amount,poBudgetExcess:amount!=null&&p.supplierBudget!=null?Math.max(0,Math.round(amount*100)-Math.round(p.supplierBudget*100))/100:null};
 });
}