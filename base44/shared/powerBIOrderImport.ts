import {powerToken,powerRequest,reportAddress,powerQuery} from './financePowerBI.ts';
import {powerBIOrderState} from './powerBIOrderState.ts';
import {modelColumns,validateOrderSources,orderTotalsDax,orderPageDax} from './powerBIOrderDax.ts';
import {sourceKey,resolveFinanceProjects} from './financeProjectMatching.ts';
import {mapPowerBIOrderDates} from './powerBIOrderDates.ts';
export async function configurePowerBIOrders(base44,input){
 const old=await powerBIOrderState(base44);if(old?.status==='running')throw new Error('Wait for the current import to finish before changing its mappings.');
 const address=reportAddress(input.reportURL),token=await powerToken(base44),report=await powerRequest(token,`groups/${address.workspace_id}/reports/${address.report_id}`);
 const columns=await modelColumns(token,report.datasetId),sources=validateOrderSources(input.sources,columns);
 const values={key:'primary',namespace:`powerbi:${report.datasetId}`,dataset_id:report.datasetId,...address,report_name:report.name,sources,revision:crypto.randomUUID(),status:'configured',error:'',...(old&&old.dataset_id!==report.datasetId?{active_generation:''}:{})};
 const record=old?await base44.entities.PowerBIOrderImport.update(old.id,values):await base44.entities.PowerBIOrderImport.create(values);return {state:record,notice:'Model field mappings verified and saved. Import the data to review it before switching reporting.'};
}
export async function startPowerBIOrders(base44,options={}){
 const state=await powerBIOrderState(base44);if(!state)throw new Error('Save the semantic-model mappings first.');
 if(state.status==='running')throw new Error('An import is already running. Continue it rather than starting again.');
 if(state.lease_until>new Date().toISOString()&&state.lease_token!==options.leaseToken)throw new Error('Another import is starting. Wait for its progress to appear.');
 if(options.automatic&&(state.revision!==options.approvedRevision||JSON.stringify(state.sources)!==JSON.stringify(state.active_sources)))throw new Error('Review and confirm changed mappings before automatic imports can publish them.');
 const token=await powerToken(base44),tables=[];
 for(const type of ['PO','SO']){
  const summary=(await powerQuery(token,state.dataset_id,orderTotalsDax(state.sources[type])))[0];
  if(summary.Rows!==summary.Orders||summary.BlankReferences)throw new Error(`${type}: each source row needs a unique, nonblank order reference; map an order-level table rather than line items.`);
  tables.push({type,kind:type==='PO'?'purchase_orders':'sales_orders',logical:state.sources[type].table,label:type==='PO'?'Purchase orders':'Sales orders',fields:{amount:state.sources[type].value},expected:summary.Rows,expected_amount:summary.Amount??null,expected_missing:summary.Missing||0,processed:0,cursor:'',complete:false});
 }
 const record=await base44.entities.PowerBIOrderImport.update(state.id,{status:'running',generation:crypto.randomUUID(),table_index:0,tables:{list:tables,...(options.automatic?{automatic:{revision:state.revision,started_at:new Date().toISOString()}}:{})},error:'',lease_token:'',lease_until:'1970-01-01T00:00:00.000Z'});return {state:record};
}
export async function batchPowerBIOrders(base44,input){
 const state=await powerBIOrderState(base44);if(!state||state.status!=='running')return {state};
 if(input.generation!==state.generation)throw new Error('This import has changed. Reload its progress.');
 const db=base44.entities,now=new Date().toISOString(),lease=crypto.randomUUID();
 const lock=await db.PowerBIOrderImport.updateMany({id:state.id,status:'running',generation:state.generation,updated_date:state.updated_date,lease_until:{$lt:now}},{$set:{lease_token:lease,lease_until:new Date(Date.now()+240000).toISOString()}});
 if(!lock.updated)return {state,busy:true};
 try{
  const tables=state.tables.list,t=tables[state.table_index],token=await powerToken(base44),rows=await powerQuery(token,state.dataset_id,orderPageDax(state.sources[t.type],t.cursor));
  if(rows.length>100||rows.some(r=>!r.Reference)||new Set(rows.map(r=>r.Reference)).size!==rows.length)throw new Error('Order paging returned duplicate or missing references. No partial snapshot is published.');
  const dated=await mapPowerBIOrderDates(base44,state,rows,token),dateByRef=new Map(dated.map(row=>[row.Reference,row.date]));
   const at=new Date().toISOString(),pairs=[...new Map(rows.map(r=>[JSON.stringify([r.Project,r.Code]),{Project:r.Project,Code:r.Code}])).values()];
  const mapped=await resolveFinanceProjects(base44,{dataset_id:state.namespace},pairs),keys=new Map(mapped.map(r=>[JSON.stringify([r.Project,r.Code]),r.source_key]));
  const records=rows.map(r=>({record_key:`${state.generation}:${t.type}:${r.Reference}`,generation:state.generation,namespace:state.namespace,kind:t.kind,source_table:t.logical,source_id:`${t.type}:${r.Reference}`,reference:r.Reference,name:r.Reference,project_key:keys.get(JSON.stringify([r.Project,r.Code])),project_name:r.Project,project_code:r.Code,supplier_name:r.Supplier||'',amount:typeof r.Amount==='number'?r.Amount:null,has_amount:typeof r.Amount==='number',date:dateByRef.get(r.Reference)||null,vat:null,gross:null,active:true,synced_at:at}));
  const projects=mapped.map(r=>({record_key:`${state.generation}:project:${r.source_key}`,namespace:state.namespace,generation:state.generation,kind:'projects',source_table:'Power BI order projects',source_id:r.source_key,project_key:r.source_key,project_name:r.Project,project_code:r.Code,name:r.Project,reference:r.Code,has_amount:false,active:true,synced_at:at}));
  if(records.length)await db.FinanceDataverseRecord.upsert([...records,...projects],{key:'record_key'});
  t.processed+=rows.length;t.cursor=rows.at(-1)?.Reference||t.cursor;t.complete=rows.length<100;
  if(t.processed>t.expected)throw new Error('The model changed during import. Start a fresh import.');
  let index=t.complete?state.table_index+1:state.table_index;
  if(index===tables.length){
   const totals=await db.FinanceDataverseRecord.aggregate({query:{namespace:state.namespace,generation:state.generation,kind:{$in:['purchase_orders','sales_orders']}},groupBy:['kind','has_amount'],sum:'amount'});
   for(const table of tables){const grouped=totals.rows.filter(r=>r.kind===table.kind),count=grouped.reduce((n,r)=>n+r.count,0),amount=grouped.find(r=>r.has_amount)?.sum_amount??null,missing=grouped.find(r=>!r.has_amount)?.count||0;
    const current=(await powerQuery(token,state.dataset_id,orderTotalsDax(state.sources[table.type])))[0];
    if(totals.truncated||count!==table.expected||count!==current.Rows||missing!==table.expected_missing||missing!==(current.Missing||0)||(amount==null)!=(table.expected_amount==null)||(amount!=null&&(Math.abs(amount-table.expected_amount)>0.02||Math.abs(amount-current.Amount)>0.02)))throw new Error('Imported order counts or totals do not reconcile with the model. No reporting source has been changed.');
    table.imported_amount=amount;
   }
  }
  const completed=index===tables.length;const record=await db.PowerBIOrderImport.update(state.id,{tables:{...state.tables,list:tables},table_index:index,status:completed?'completed':'running',lease_token:'',lease_until:'1970-01-01T00:00:00.000Z',...(completed?{last_completed_at:at}:{})});return {state:record,processed:rows.length};
 }catch(error){await db.PowerBIOrderImport.update(state.id,{status:'error',error:String(error.message).slice(0,1000),lease_token:'',lease_until:'1970-01-01T00:00:00.000Z'});throw error;}
}
export async function confirmPowerBIOrders(base44,user,input){
 const state=await powerBIOrderState(base44);if(state?.status!=='completed'||input.generation!==state.generation||input.revision!==state.revision)throw new Error('Complete and review the latest import before switching reporting.');
 if(input.netGBPConfirmed!==true)throw new Error('Confirm that the mapped Total columns are GBP values excluding VAT before using them as net financial figures.');
 const record=await base44.entities.PowerBIOrderImport.update(state.id,{active_generation:state.generation,active_sources:state.sources,confirmed_at:new Date().toISOString(),confirmed_by:user.id});return {state:record,notice:'Power BI is now the PO/SO reporting source. Dataverse records have not been deleted or edited.'};
}