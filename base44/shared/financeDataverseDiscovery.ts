import {flowConfig,sharedFlowContext,flowRequest} from './dataverseFlowApi.ts';
export async function discoverFinanceTables(base44){
 const context=await sharedFlowContext(base44,await flowConfig(base44));
 const query=new URLSearchParams({'$select':'LogicalName,EntitySetName,PrimaryIdAttribute,PrimaryNameAttribute,DisplayName','$filter':['cr78c_purchase_order','cr78c_purchase_order_line_item','cr78c_supplier','cr78c_project','cr78c_sales_invoice','cr78c_sales_order','cr78c_sales_invoice_line_item','cr78c_sales_invoice_line','cr78c_projects','als_supplier','cr78c_customers','invoice','salesorder','account','bss_project'].map(n=>`LogicalName eq '${n}'`).join(' or ')});
 const d=await flowRequest(context.environment,context.token,`EntityDefinitions?${query}`);
 return {environment:context.environment,tables:(d.value||[]).map(t=>({logical:t.LogicalName,set:t.EntitySetName,id:t.PrimaryIdAttribute,name:t.PrimaryNameAttribute,label:t.DisplayName?.UserLocalizedLabel?.Label||t.LogicalName}))};
}
export async function inspectFinanceTable(base44,logical){
 if(!/^[a-z][a-z0-9_]{0,100}$/i.test(logical||''))throw new Error('Invalid table name.');
 const context=await sharedFlowContext(base44,await flowConfig(base44));
 const m=await flowRequest(context.environment,context.token,`EntityDefinitions(LogicalName='${logical}')?$select=EntitySetName,PrimaryIdAttribute,PrimaryNameAttribute`);
 const d=await flowRequest(context.environment,context.token,`EntityDefinitions(LogicalName='${logical}')/Attributes?$select=LogicalName,AttributeType,DisplayName`);
 const lookups=await flowRequest(context.environment,context.token,`EntityDefinitions(LogicalName='${logical}')/Attributes/Microsoft.Dynamics.CRM.LookupAttributeMetadata?$select=LogicalName,Targets`);
 const sample=logical==='cr78c_projects'?(await flowRequest(context.environment,context.token,`${m.EntitySetName}?$select=cr78c_name,cr78c_reference&$top=3`)).value:logical==='cr78c_purchase_order'?(await flowRequest(context.environment,context.token,`${m.EntitySetName}?$select=cr78c_name,cr78c_total_net_value&$top=3`)).value:undefined;
 return {...m,logical,sample,fields:(d.value||[]).filter(f=>!f.LogicalName.includes('yomi')&&!f.LogicalName.endsWith('base')).map(f=>({name:f.LogicalName,type:f.AttributeType,label:f.DisplayName?.UserLocalizedLabel?.Label||f.LogicalName,targets:lookups.value?.find(l=>l.LogicalName===f.LogicalName)?.Targets||[]}))};
}