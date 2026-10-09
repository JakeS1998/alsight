import {flowConfig} from './dataverseFlowApi.ts';
import {financeSpecs} from './financeDataverseSpecs.ts';
import {inspectFinanceTable} from './financeDataverseDiscovery.ts';
const labels={projects:'Finance projects',suppliers:'Suppliers',customers:'Customers',purchase_orders:'Purchase orders',line_items:'PO line items',invoices:'Sales invoices'};
const fieldLabels={name:'Name',reference:'Reference / number',company_number:'Company number',amount:'Net amount (excluding VAT)',vat:'VAT amount',gross:'Gross amount',description:'Description',project_source_id:'Finance project lookup',parent_id:'Purchase order lookup',supplier_source_id:'Supplier lookup',alternate_supplier:'Alternative supplier lookup',customer_source_id:'Customer lookup',approval:'Approval status',approved:'Approved',sent:'Sent',date:'Sent / transaction date'};
const numeric=['Money','Decimal','Double','Integer','BigInt'];
const types=key=>['amount','vat','gross'].includes(key)?numeric:['approved','sent'].includes(key)?['Boolean']:key==='date'?['DateTime']:['project_source_id','parent_id','supplier_source_id','alternate_supplier','customer_source_id'].includes(key)?['Lookup','Uniqueidentifier']:['String','Memo','Uniqueidentifier','Picklist','State','Status','Integer','BigInt'];
export function configuredFinanceSpecs(config){return financeSpecs.map(spec=>{const saved=config?.tables?.financeMappings?.[spec.logical];return {...spec,key:spec.logical,label:spec.logical==='als_supplier'?'Additional suppliers':labels[spec.kind],logical:saved?.logical||spec.logical,fields:{...spec.fields,...(spec.kind==='invoices'?{amount:'',vat:'',gross:''}:{}),...saved?.fields},configured:Boolean(saved),verified_at:saved?.verified_at||null};});}
const requiredFields=spec=>['name',...(spec.kind==='projects'?['reference']:[]),...(['purchase_orders','invoices'].includes(spec.kind)?['project_source_id']:[]),...(spec.kind==='line_items'?['parent_id']:[])];
export async function financeMappingStatus(base44){const config=await flowConfig(base44);return {configured:Boolean(config?.source_connection_id),tables:configuredFinanceSpecs(config).map(spec=>({...spec,definitions:Object.keys(spec.fields).map(key=>({key,label:fieldLabels[key]||key,types:types(key),required:requiredFields(spec).includes(key)}))}))};}
export async function saveFinanceFieldMapping(base44,user,input){
 const config=await flowConfig(base44);if(!config?.source_connection_id)throw new Error('Confirm the shared Dataverse read connection first.');
 const spec=configuredFinanceSpecs(config).find(s=>s.key===input.key);if(!spec)throw new Error('Choose a supported finance table.');
 if(!input.fields||typeof input.fields!=='object'||Array.isArray(input.fields)||Object.keys(input.fields).length>25)throw new Error('Invalid finance field mapping.');
 if(Object.keys(input.fields).some(key=>!Object.hasOwn(spec.fields,key)))throw new Error('Unsupported finance field.');
 const metadata=await inspectFinanceTable(base44,input.logical),fields={};
 for(const key of Object.keys(spec.fields)){
  const source=input.fields[key]||'';if(typeof source!=='string'||source.length>100)throw new Error('Invalid finance source field.');
  if(!source){if(requiredFields(spec).includes(key))throw new Error(`${fieldLabels[key]} must be mapped.`);fields[key]='';continue;}
  const attribute=metadata.fields.find(f=>f.name===source);if(!attribute||!types(key).includes(attribute.type))throw new Error(`${fieldLabels[key]} needs a compatible Dataverse field.`);
  fields[key]=source;
 }
 const latest=await flowConfig(base44);if(latest?.environment_url!==config.environment_url)throw new Error('The Dataverse environment changed. Reload before saving.');
 const saved={logical:metadata.logical,fields,verified_at:new Date().toISOString(),verified_by:user.id};
 await base44.entities.DataverseFlowConfig.update(latest.id,{tables:{...latest.tables,financeMappings:{...latest.tables?.financeMappings,[spec.key]:saved}}});
 return {notice:'Finance mapping verified and saved. Start a new finance sync to apply it; completed snapshots remain unchanged.'};
}