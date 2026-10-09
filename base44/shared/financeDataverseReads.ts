import {financeDashboardSummary} from './financeDashboardSummary.ts';
export async function readDataverseFinance(base44,state,input){
 const db=base44.entities,base={generation:state.active_generation,namespace:state.namespace,active:true};
 if(input.action==='summary')return await financeDashboardSummary(base44,state,base);
 if(input.action==='transactions'){
  if(!['purchase_orders','line_items','invoices'].includes(input.kind)||!['all','amount','link','date'].includes(input.issue||'all'))throw new Error('Invalid transaction filter.');
  if(String(input.search||'').length>120||String(input.cursor||'').length>8192)throw new Error('Transaction search or cursor is too long.');
  const search=String(input.search||'').trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const query={...base,kind:input.kind,...(input.issue==='amount'?{has_amount:false}:input.issue==='link'?{[input.kind==='line_items'?'parent_id':'project_key']:{$in:['',null]}}:input.issue==='date'?{date:{$in:['',null]}}:{}),...(search?{$or:[{reference:{$regex:search,$options:'i'}},{description:{$regex:search,$options:'i'}}]}:{})};
  const page=await db.FinanceDataverseRecord.filter(query,{limit:50,sort:'reference',...(input.cursor?{cursor:input.cursor}:{})});
  if(input.kind==='line_items'&&page.items.length){const ids=[...new Set(page.items.map(r=>r.parent_id).filter(Boolean))],parents=ids.length?(await db.FinanceDataverseRecord.filter({...base,kind:'purchase_orders',source_id:{$in:ids}},{limit:50,fields:['source_id','reference','project_name']})).items:[];page.items=page.items.map(r=>({...r,parent_reference:parents.find(p=>p.source_id===r.parent_id)?.reference||''}));}
  return {...page,total:await db.FinanceDataverseRecord.count(query),read_at:state.last_completed_at};
 }
 if(input.action==='list'){
  const search=String(input.search||'').trim().slice(0,120).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const query={...base,kind:'projects',...(search?{$or:[{name:{$regex:search,$options:'i'}},{reference:{$regex:search,$options:'i'}}]}:{})};
  const page=await db.FinanceDataverseRecord.filter(query,{distinct:'project_key',limit:50,sort:'project_key',...(input.after?{cursor:input.after}:{})});
  const keys=page.items;
  const mappings=keys.length?(await db.FinanceProjectMapping.filter({dataset_id:state.namespace,source_key:{$in:keys}},{limit:100})).items:[];
  const values=keys.length?(await db.FinanceDataverseRecord.aggregate({query:{...base,project_key:{$in:keys},kind:{$in:['purchase_orders','invoices']}},groupBy:['project_key','kind','has_amount'],sum:'amount'})).rows:[];
  return {items:keys.map(key=>{const m=mappings.find(m=>m.source_key===key),po=values.filter(r=>r.project_key===key&&r.kind==='purchase_orders'),invoices=values.filter(r=>r.project_key===key&&r.kind==='invoices');return {Project:m?.source_name||'Name unavailable',Code:m?.source_code||'',source_key:key,PO:po.find(r=>r.has_amount)?.sum_amount??null,POCount:po.reduce((n,r)=>n+r.count,0),Invoice:invoices.find(r=>r.has_amount)?.sum_amount??null,InvoiceCount:invoices.reduce((n,r)=>n+r.count,0),InvoiceMissing:invoices.find(r=>!r.has_amount)?.count||0,Missing:po.find(r=>!r.has_amount)?.count||0,mapping:m||{status:'unmatched'}};}),has_more:page.has_more,next:page.next_cursor||null,read_at:state.last_completed_at};
 }
 if(input.action==='orders'||input.action==='invoices'){
  if(!/^[a-f0-9]{64}$/.test(input.sourceKey||''))throw new Error('Invalid source project.');
  if(input.type==='SO')return {items:[],has_more:false,unavailable:'No sales-order table was found in the referenced Dataverse sources. Sales invoices are not treated as sales orders.'};
  const kind=input.action==='invoices'?'invoices':'purchase_orders';
  const page=await db.FinanceDataverseRecord.filter({...base,kind,project_key:input.sourceKey},{limit:50,sort:'reference',...(input.after?{cursor:input.after}:{})});
  return {...page,read_at:state.last_completed_at};
 }
 if(input.action==='dvDetail'){
  const r=await db.FinanceDataverseRecord.get(input.recordId);if(r?.generation!==state.active_generation||r.namespace!==state.namespace||!['purchase_orders','invoices','line_items'].includes(r.kind))throw new Error('Refresh the dashboard before opening this transaction.');
  const supplier=r.supplier_source_id?(await db.FinanceDataverseRecord.filter({...base,kind:'suppliers',source_id:r.supplier_source_id,active:{$in:[true,false]}},{limit:2})).items:[];
  const customer=r.customer_source_id?(await db.FinanceDataverseRecord.filter({...base,kind:'customers',source_id:r.customer_source_id,active:{$in:[true,false]}},{limit:2})).items:[];
  const lines=r.kind==='purchase_orders'?await db.FinanceDataverseRecord.filter({...base,kind:'line_items',parent_id:r.source_id},{limit:50,sort:'name',...(input.cursor?{cursor:input.cursor}:{})}):{items:[],has_more:false};
  const totals=r.kind==='purchase_orders'?(await db.FinanceDataverseRecord.aggregate({query:{...base,kind:'line_items',parent_id:r.source_id},groupBy:'has_amount',sum:'amount'})).rows:[];
  return {record:r,supplier:supplier.length===1?supplier[0]:null,customer:customer.length===1?customer[0]:null,lines,totals};
 }
 throw new Error('Unsupported Dataverse finance operation.');
}