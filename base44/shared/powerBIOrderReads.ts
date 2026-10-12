import {readDataverseFinance} from './financeDataverseReads.ts';
export async function readPowerBIOrderFinance(base44,state,dataverse,input){
 const base={namespace:state.namespace,generation:state.active_generation,active:true},db=base44.entities;
 if(input.action==='summary'){
  const data=await readDataverseFinance(base44,state,input);
  if(dataverse?.active_generation){const invoices=await db.FinanceDataverseRecord.aggregate({query:{namespace:dataverse.namespace,generation:dataverse.active_generation,active:true,kind:'invoices'},groupBy:['kind','has_amount'],sum:'amount'});data.amounts.push(...invoices.rows);data.invoices_have_values=invoices.rows.some(r=>r.has_amount);}
  data.source='Completed Power BI PO/SO snapshot. Order values are confirmed GBP excluding VAT. PO totals include ALSight-linked projects only. Sales invoices remain sourced from Dataverse.';data.powerbi=true;return data;
 }
 if(input.action==='list'){
  const page=await readDataverseFinance(base44,state,input),ids=[...new Set(page.items.map(r=>r.mapping?.project_id).filter(Boolean))];
  if(dataverse?.active_generation&&ids.length){
   const links=await db.FinanceProjectMapping.filter({dataset_id:dataverse.namespace,project_id:{$in:ids}},{limit:500,fields:['source_key','project_id']});if(links.has_more)throw new Error('Invoice project links exceed the reporting limit.');
   const totals=links.items.length?await db.FinanceDataverseRecord.aggregate({query:{namespace:dataverse.namespace,generation:dataverse.active_generation,active:true,kind:'invoices',project_key:{$in:links.items.map(m=>m.source_key)}},groupBy:['project_key','has_amount'],sum:'amount'}):{rows:[]};if(totals.truncated)throw new Error('Invoice totals exceed the reporting limit.');
   for(const row of page.items){const keys=links.items.filter(m=>m.project_id===row.mapping?.project_id).map(m=>m.source_key),groups=totals.rows.filter(r=>keys.includes(r.project_key));row.Invoice=groups.some(r=>r.has_amount)?groups.filter(r=>r.has_amount).reduce((n,r)=>n+r.sum_amount,0):null;row.InvoiceCount=groups.reduce((n,r)=>n+r.count,0);row.InvoiceMissing=groups.filter(r=>!r.has_amount).reduce((n,r)=>n+r.count,0);}
  }return page;
 }
 if(input.action==='invoices'){
  if(!dataverse?.active_generation)return {items:[],has_more:false};
  const mapping=(await db.FinanceProjectMapping.filter({dataset_id:state.namespace,source_key:input.sourceKey},{limit:1})).items[0];
  if(!mapping?.project_id)return {items:[],has_more:false,unavailable:'Link this Power BI project to an ALSight project to find its existing Dataverse invoices.'};
  const links=await db.FinanceProjectMapping.filter({dataset_id:dataverse.namespace,project_id:mapping.project_id},{limit:100,fields:['source_key']});if(links.has_more)throw new Error('Invoice project links exceed the reporting limit.');
  return db.FinanceDataverseRecord.filter({namespace:dataverse.namespace,generation:dataverse.active_generation,active:true,kind:'invoices',project_key:{$in:links.items.map(m=>m.source_key)}},{limit:50,sort:'reference',...(input.after?{cursor:input.after}:{})});
 }
 if(input.action==='transactions'&&['line_items','invoices'].includes(input.kind)){if(!dataverse?.active_generation)return {items:[],has_more:false,total:0};return readDataverseFinance(base44,dataverse,input);}
 if(input.action==='dvDetail'){
  const r=await db.FinanceDataverseRecord.get(input.recordId);return readDataverseFinance(base44,r.namespace===state.namespace?state:dataverse,input);
 }
 return readDataverseFinance(base44,state,input);
}