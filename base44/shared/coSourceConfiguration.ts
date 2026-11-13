import {now,audit,fail,get} from './coCore.ts';
import {mappingSource,resolveFolder} from './coMicrosoft.ts';
import {isGuid} from './dataverseFlowFields.ts';
import {discoverSource} from './coCustom.ts';
export async function addSource(b,u,c,input){
 const E=b.asServiceRole.entities,production=c.mode==='production';
 if(await E.CODataset.count({})>=50)fail('Fifty source configurations are supported; review existing sources first.');
 if(production?input.production_confirmed!==true:input.pilot_confirmed!==true)fail(production?'Confirm the approved live source and read scope for continuous standby copying.':'Confirm these are isolated pilot targets.');
 const scope=input.scope_ids||[],estate=production&&input.read_scope==='estate';
 if(!Array.isArray(scope)||scope.length>100||scope.some(id=>!isGuid(id))||estate&&scope.length)fail('Enter up to 100 valid source GUIDs, or choose the whole-table read scope.');
 if(production&&!['estate','records'].includes(input.read_scope))fail('Choose a whole-table or specific-record read scope.');
 const interval=Number(input.interval_minutes||60);if(![60,120,240,1440].includes(interval))fail('Choose an approved cadence.');
 let values;
 if(input.kind==='dataverse'){
  if(!estate&&!scope.length)fail('Choose approved source record IDs or explicitly approve whole-table production reads.');
  let source;
  if(input.logical_name){
   source=await discoverSource(b,input.logical_name);const cols=input.columns,writes=input.writable||[];
   if(!Array.isArray(cols)||cols.length<1||cols.length>40||!Array.isArray(writes)||cols.some(k=>!source.mapping.mappings.some(m=>m.local===k))||writes.some(k=>!cols.includes(k)||!source.mapping.mappings.some(m=>m.local===k&&m.write)))fail('Choose at most forty known copied fields and only supported editable columns.');
   source.mapping.mappings=source.mapping.mappings.filter(m=>cols.includes(m.local)).map(m=>({...m,write:writes.includes(m.local)&&m.write}));
  }else source=await mappingSource(b,input.table_key);
  values={...source,kind:'dataverse',scope_ids:scope,label:String(input.label||input.table_key||input.logical_name).slice(0,120),mapping:{...source.mapping,...(estate?{estate_approval:{by:u.id,at:now()}}:{})}};
 }else if(input.kind==='sharepoint'){
  if(typeof input.folder_url!=='string'||!input.folder_url||input.folder_url.length>1500)fail('Enter the approved source folder link.');
  values={...await resolveFolder(b,input.folder_url),kind:'sharepoint',scope_ids:[],label:String(input.label||'Approved SharePoint folder').slice(0,120)};
 }else fail('Choose Dataverse or SharePoint.');
 const source=await E.CODataset.create({...values,enabled:true,version:1,interval_minutes:interval,retention_days:c.policy?.retention_days||365,state:{}});
 await E.COConfig.update(c.id,{acceptance:{}});
 await audit(b,u,production?'Production standby source approved':'Approved pilot source added',{id:source.id,label:source.label,scope,estate_reads:estate});return source;
}
export async function expandSource(b,u,c,input){
 if(input.confirmation!=='APPROVE ESTATE READS')fail('Explicit confirmation is required to widen the read scope.',409);
 const E=b.asServiceRole.entities,d=await get(E.CODataset,input.id);
 if(d.kind!=='dataverse')fail('Approve a separate explicitly scoped folder for wider document coverage.');
 await E.CODataset.update(d.id,{scope_ids:[],mapping:{...d.mapping,pilot_scope_ids:d.mapping.pilot_scope_ids||d.scope_ids,estate_approval:{by:u.id,at:now()}},state:{}});
 await E.COConfig.update(c.id,{acceptance:{}});await audit(b,u,'Full-estate read scope approved',{dataset_id:d.id});
 return{ok:true,message:'Whole-table standby reads approved. Employee access remains disabled until two administrators activate an incident.'};
}
export async function reviewSource(b,u,c,input){
 if(input.remove_scope===true)fail('Approve wider read scope explicitly; it cannot be silently changed.');
 const E=b.asServiceRole.entities,d=await get(E.CODataset,input.id);
 await E.CODataset.update(d.id,{enabled:!!input.enabled});await E.COConfig.update(c.id,{acceptance:{}});
 await audit(b,u,'Source enabled state changed',{id:d.id,enabled:!!input.enabled});return{ok:true};
}