import { flowConfig,sharedFlowContext,flowRequest } from './dataverseFlowApi.ts';
const identifier=v=>{if(!/^[a-z_][a-z0-9_]{0,100}$/i.test(v||''))throw new Error('Enter Dataverse logical column names supplied by your administrator.');return v;};
export async function validateFinanceInvoices(base44,input){
 const context=await sharedFlowContext(base44,await flowConfig(base44));
 const logical=identifier(input.logical_name);
 const meta=await flowRequest(context.environment,context.token,`EntityDefinitions(LogicalName='${logical}')?$select=EntitySetName,PrimaryIdAttribute`);
 const attrs=await flowRequest(context.environment,context.token,`EntityDefinitions(LogicalName='${logical}')/Attributes?$select=LogicalName,AttributeType`);
 const fields={};
 for(const k of ['project','reference','net','date','status']){
 const v=String(input[k]||'').trim();if(!v&&['date','status'].includes(k)){fields[k]='';continue;}
 identifier(v);const logicalColumn=v.replace(/^_/,'').replace(/_value$/,'');
 const attr=attrs.value?.find(a=>a.LogicalName===(k==='project'?logicalColumn:v));
 if(!attr)throw new Error(`Dataverse column ${v} was not found.`);
 if(k==='project'&&attr.AttributeType!=='Lookup')throw new Error('The invoice project column must be a project lookup, using _<logical name>_value.');
 if(k==='project'&&!/^_.+_value$/.test(v))throw new Error('Use the project lookup Web API name: _<logical column name>_value.');
 if(k==='net'&&!['Money','Decimal','Double','Integer','BigInt'].includes(attr.AttributeType))throw new Error('Select a numeric invoice net-value column, excluding VAT.');
 fields[k]=v;
 }
 return {logical_name:logical,entity_set:meta.EntitySetName,id:meta.PrimaryIdAttribute,...fields};
}
export async function liveFinanceInvoices(base44,config,mapping,input){
 if(!config.invoices)return {unavailable:'An administrator must configure the Dataverse sales-invoice table and net-value columns.',items:[]};
 if(!mapping.project_id)return {unavailable:'Link this Power BI project before loading sales invoices.',items:[]};
 const p=await base44.entities.Project.get(mapping.project_id);
 if(!/^[0-9a-f-]{36}$/i.test(p?.dataverse_id||''))return {unavailable:'The linked project has no Dataverse project identifier.',items:[]};
 const c=config.invoices,context=await sharedFlowContext(base44,await flowConfig(base44));
 const fields=[c.id,c.project,c.reference,c.net,c.date,c.status].filter(Boolean);
 if(input.cursor&&(typeof input.cursor!=='string'||input.cursor.length>12000))throw new Error('Invalid invoice page.');
 const query=new URLSearchParams({'$select':fields.join(','),'$filter':`${c.project} eq ${p.dataverse_id}`,'$orderby':`${c.id} asc`,...(input.cursor?{'$skiptoken':input.cursor}:{})});
 const d=await flowRequest(context.environment,context.token,`${c.entity_set}?${query}`,{headers:{Prefer:'odata.maxpagesize=50,odata.include-annotations="OData.Community.Display.V1.FormattedValue"'}});
 const shown=d.value||[];if(shown.length>50)throw new Error('Dataverse did not honour invoice paging. Ask your administrator to check the source.');
 const next=d['@odata.nextLink']?new URL(d['@odata.nextLink']).searchParams.get('$skiptoken'):null;
 return {items:shown.map(r=>({id:r[c.id],reference:r[c.reference],net:r[c.net],date:c.date?r[c.date]:null,status:c.status?(r[`${c.status}@OData.Community.Display.V1.FormattedValue`]??r[c.status]):null})),has_more:Boolean(next),next,read_at:new Date().toISOString(),source:'Live Dataverse sales invoices, net values excluding VAT. Invoice totals are not treated as sales-order totals.'};
}