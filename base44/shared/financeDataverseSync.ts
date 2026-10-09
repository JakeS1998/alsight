import {flowConfig,sharedFlowContext,flowRequest} from './dataverseFlowApi.ts';
import {discoverFinanceTables,inspectFinanceTable} from './financeDataverseDiscovery.ts';
import {financeNamespace} from './financeDataverseSpecs.ts';
import {configuredFinanceSpecs} from './financeDataverseMappings.ts';
import {resolveFinanceProjects} from './financeProjectMatching.ts';
export async function financeSyncState(base44){return (await base44.asServiceRole.entities.FinanceDataverseSync.filter({key:'primary'},{limit:1})).items[0]||null;}
export async function startFinanceSync(base44){
 const old=await financeSyncState(base44);if(old?.status==='running'&&(new Date(old.lease_until||0)>new Date()||Date.now()-new Date(old.updated_date).getTime()<300000))throw new Error('A finance sync is already processing.');
 const discovered=await discoverFinanceTables(base44),tables=[],specs=configuredFinanceSpecs(await flowConfig(base44));
 for(const spec of specs){
  const available=discovered.tables.find(t=>t.logical===spec.logical);if(!available&&!spec.configured){if(spec.key==='als_supplier')continue;throw new Error(`Dataverse finance table ${spec.logical} is unavailable.`);}
  const m=await inspectFinanceTable(base44,spec.logical),fields={};
  for(const [local,name]of Object.entries(spec.fields)){if(!name)continue;const attr=m.fields.find(f=>f.name===name);if(!attr&&spec.configured)throw new Error(`Mapped finance field ${name} is missing from ${spec.logical}. Inspect and verify its mapping again.`);if(attr)fields[local]={name:attr.type==='Lookup'?`_${name}_value`:name,type:attr.type};}
  if(!fields.name||(spec.kind==='projects'&&!fields.reference)||(spec.kind==='purchase_orders'&&!fields.project_source_id)||(spec.kind==='line_items'&&!fields.parent_id))throw new Error(`Required finance relationships are missing from ${spec.logical}.`);
  const selected=[m.PrimaryIdAttribute,'statecode','modifiedon',...Object.values(fields).map(f=>f.name)];
  const context=await sharedFlowContext(base44,await flowConfig(base44));
  await flowRequest(context.environment,context.token,`${m.EntitySetName}?$select=${[...new Set(selected)].join(',')}&$top=1`);
  tables.push({...spec,set:m.EntitySetName,id:m.PrimaryIdAttribute,fields,selected:[...new Set(selected)],cursor:'',processed:0,complete:false});
 }
 const values={key:'primary',namespace:financeNamespace(discovered.environment),generation:crypto.randomUUID(),active_generation:old?.namespace===financeNamespace(discovered.environment)?old.active_generation||'':'',status:'running',tables:{list:tables},table_index:0,page_index:0,dispatch_token:crypto.randomUUID(),lease_token:'',lease_until:'1970-01-01T00:00:00.000Z',error:''};
 const state=old?await base44.entities.FinanceDataverseSync.update(old.id,values):await base44.entities.FinanceDataverseSync.create(values);return {state,notice:'Dataverse read access verified. Finance tables are syncing in background batches.'};
}
export async function continueFinanceSync(base44,input){
 const deadline=Date.now()+210000;let batches=0;
 while(Date.now()<deadline&&batches<250){
  const state=await financeSyncState(base44);
  if(!state||state.generation!==input.generation||state.status!=='running')return {completed:true,status:state?.status||'idle',batches};
  const result=await syncFinanceBatch(base44,{dispatchToken:state.dispatch_token});
  batches++;if(result.skipped)return {completed:false,busy:true,batches};
  if(result.completed)return {completed:true,status:'completed',batches};
 }
 return {completed:false,batches};
}
const number=value=>typeof value==='number'&&Number.isFinite(value)?value:null;
export async function syncFinanceBatch(base44,input){
 const db=base44.entities,state=await financeSyncState(base44);
 if(!state||state.status!=='running'||state.dispatch_token!==input.dispatchToken)return {skipped:true};
 if(state.page_index>=1000){await db.FinanceDataverseSync.update(state.id,{status:'error',error:'Finance sync reached its page limit; ask an administrator to review the source.'});throw new Error('Finance sync reached its page limit.');}
 const now=new Date().toISOString(),lease=crypto.randomUUID();
 const lock=await db.FinanceDataverseSync.updateMany({id:state.id,status:'running',dispatch_token:input.dispatchToken,lease_until:{$lt:now}},{$set:{lease_token:lease,lease_until:new Date(Date.now()+240000).toISOString()}});
 if(!lock.updated)return {skipped:true};
 try{
  const context=await sharedFlowContext(base44,await flowConfig(base44)),tables=state.tables.list,t=tables[state.table_index];
  const path=t.cursor||`${t.set}?${new URLSearchParams({'$select':t.selected.join(','),'$orderby':`${t.id} asc`})}`;
  const d=await flowRequest(context.environment,context.token,path,{headers:{Prefer:'odata.maxpagesize=100,odata.include-annotations="OData.Community.Display.V1.FormattedValue"'}});
  const rows=d.value||[];if(rows.length>100)throw new Error('Dataverse did not honour the finance page size.');
  const at=new Date().toISOString(),records=rows.map(row=>{
   const get=k=>t.fields[k]?row[t.fields[k].name]:undefined,label=k=>t.fields[k]?row[`${t.fields[k].name}@OData.Community.Display.V1.FormattedValue`]:undefined;
   const amount=number(get('amount'));
   return {record_key:`${state.generation}:${t.logical}:${row[t.id]}`,namespace:state.namespace,generation:state.generation,kind:t.kind,source_table:t.logical,source_id:row[t.id],name:String(get('name')||''),reference:String(get('reference')||get('name')||''),project_source_id:get('project_source_id')||'',project_key:'',project_name:'',project_code:'',parent_id:get('parent_id')||'',supplier_source_id:get('supplier_source_id')||get('alternate_supplier')||'',customer_source_id:get('customer_source_id')||'',company_number:String(get('company_number')||''),amount,has_amount:amount!==null,vat:number(get('vat')),gross:number(get('gross')),description:String(get('description')||''),approval:String(label('approval')??get('approval')??''),approved:get('approved')===true,sent:get('sent')===true,date:get('date')||null,source_modified_at:row.modifiedon||null,synced_at:at,active:row.statecode===0};
  });
  if(t.kind==='projects'){
   const mapped=await resolveFinanceProjects(base44,{dataset_id:state.namespace},records.map(r=>({Project:r.name,Code:r.reference})));
   for(let i=0;i<records.length;i++){records[i].project_key=mapped[i].source_key;records[i].project_name=records[i].name;records[i].project_code=records[i].reference;}
  }else{
   const ids=[...new Set(records.map(r=>r.project_source_id).filter(Boolean))];
   const projects=ids.length?(await db.FinanceDataverseRecord.filter({generation:state.generation,kind:'projects',source_id:{$in:ids}},{limit:200})).items:[];
   for(const r of records){const p=projects.find(p=>p.source_id===r.project_source_id);if(p){r.project_key=p.project_key;r.project_name=p.name;r.project_code=p.reference;}}
  }
  if(records.length)await db.FinanceDataverseRecord.upsert(records,{key:'record_key'});
  t.processed+=records.length;t.cursor=d['@odata.nextLink']||'';t.complete=!t.cursor;
  const index=t.complete?state.table_index+1:state.table_index,completed=index>=tables.length;
  await db.FinanceDataverseSync.update(state.id,{tables:{list:tables},table_index:index,page_index:state.page_index+1,status:completed?'completed':'running',dispatch_token:completed?'':crypto.randomUUID(),lease_token:'',lease_until:'1970-01-01T00:00:00.000Z',...(completed?{active_generation:state.generation,last_completed_at:at}:{})});
  return {processed:records.length,table:t.logical,completed};
 }catch(error){await db.FinanceDataverseSync.update(state.id,{status:'error',error:String(error.message).slice(0,1000),lease_token:'',lease_until:'1970-01-01T00:00:00.000Z'});throw error;}
}