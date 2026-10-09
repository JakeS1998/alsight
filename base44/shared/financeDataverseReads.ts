export async function readDataverseFinance(base44,state,input){
 const db=base44.entities,base={generation:state.active_generation,namespace:state.namespace,active:true};
 if(input.action==='summary'){
  const amounts=await db.FinanceDataverseRecord.aggregate({query:{...base,kind:{$in:['purchase_orders','line_items','invoices']}},groupBy:['kind','has_amount'],sum:'amount'});
  const matches=await db.FinanceProjectMapping.aggregate({query:{dataset_id:state.namespace},groupBy:'status'});
  const top=await db.FinanceDataverseRecord.aggregate({query:{...base,kind:'purchase_orders',has_amount:true},groupBy:'project_name',sum:'amount',sort:'-sum_amount',limit:8});
  return {amounts:amounts.rows,matches:matches.rows,top:top.rows,read_at:state.last_completed_at,invoices_have_values:false,source:'Completed Dataverse snapshot. Active records only; sales-invoice headers have no net-value field.'};
 }
 if(input.action==='list'){
  const search=String(input.search||'').trim().slice(0,120).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const query={...base,kind:'projects',...(search?{$or:[{name:{$regex:search,$options:'i'}},{reference:{$regex:search,$options:'i'}}]}:{})};
  const page=await db.FinanceDataverseRecord.filter(query,{limit:50,sort:'name',...(input.after?{cursor:input.after}:{})});
  const keys=page.items.map(r=>r.project_key);
  const mappings=keys.length?(await db.FinanceProjectMapping.filter({dataset_id:state.namespace,source_key:{$in:keys}},{limit:100})).items:[];
  const values=keys.length?(await db.FinanceDataverseRecord.aggregate({query:{...base,project_key:{$in:keys},kind:{$in:['purchase_orders','invoices']}},groupBy:['project_key','kind','has_amount'],sum:'amount'})).rows:[];
  return {items:page.items.map(p=>{const po=values.filter(r=>r.project_key===p.project_key&&r.kind==='purchase_orders'),invoices=values.filter(r=>r.project_key===p.project_key&&r.kind==='invoices');return {Project:p.name,Code:p.reference,source_key:p.project_key,PO:po.find(r=>r.has_amount)?.sum_amount??null,POCount:po.reduce((n,r)=>n+r.count,0),InvoiceCount:invoices.reduce((n,r)=>n+r.count,0),Missing:po.find(r=>!r.has_amount)?.count||0,mapping:mappings.find(m=>m.source_key===p.project_key)||{status:'unmatched'}};}),has_more:page.has_more,next:page.next_cursor||null,read_at:state.last_completed_at};
 }
 if(input.action==='orders'||input.action==='invoices'){
  if(!/^[a-f0-9]{64}$/.test(input.sourceKey||''))throw new Error('Invalid source project.');
  if(input.type==='SO')return {items:[],has_more:false,unavailable:'No sales-order table was found in the referenced Dataverse sources. Sales invoices are not treated as sales orders.'};
  const kind=input.action==='invoices'?'invoices':'purchase_orders';
  const page=await db.FinanceDataverseRecord.filter({...base,kind,project_key:input.sourceKey},{limit:50,sort:'reference',...(input.after?{cursor:input.after}:{})});
  return {...page,read_at:state.last_completed_at};
 }
 if(input.action==='dvDetail'){
  const r=await db.FinanceDataverseRecord.get(input.recordId);if(r?.generation!==state.active_generation||!['purchase_orders','invoices'].includes(r.kind))throw new Error('Refresh the dashboard before opening this transaction.');
  const supplier=r.supplier_source_id?(await db.FinanceDataverseRecord.filter({...base,kind:'suppliers',source_id:r.supplier_source_id},{limit:2})).items:[];
  const customer=r.customer_source_id?(await db.FinanceDataverseRecord.filter({...base,kind:'customers',source_id:r.customer_source_id},{limit:2})).items:[];
  const lines=r.kind==='purchase_orders'?await db.FinanceDataverseRecord.filter({...base,kind:'line_items',parent_id:r.source_id},{limit:50,sort:'name',...(input.cursor?{cursor:input.cursor}:{})}):{items:[],has_more:false};
  const totals=r.kind==='purchase_orders'?(await db.FinanceDataverseRecord.aggregate({query:{...base,kind:'line_items',parent_id:r.source_id},groupBy:'has_amount',sum:'amount'})).rows:[];
  return {record:r,supplier:supplier.length===1?supplier[0]:null,customer:customer.length===1?customer[0]:null,lines,totals};
 }
 throw new Error('Unsupported Dataverse finance operation.');
}