import {flowConfig,sharedFlowContext,flowRequest} from './dataverseFlowApi.ts';
const field='bss_servicesprovided',principal='Principal Contractor';
export async function insuranceReportSuppliers(base44) {
 const config=await flowConfig(base44),context=await sharedFlowContext(base44,config);
 const meta=await flowRequest(context.environment,context.token,`EntityDefinitions(LogicalName='account')/Attributes(LogicalName='${field}')/Microsoft.Dynamics.CRM.MultiSelectPicklistAttributeMetadata?$select=LogicalName&$expand=OptionSet($select=Options)`);
 const labels=new Map((meta.OptionSet?.Options || []).map(option=>[String(option.Value),option.Label?.UserLocalizedLabel?.Label || option.Label?.LocalizedLabels?.[0]?.Label]));
 if(![...labels.values()].some(label=>label?.trim().toLowerCase()===principal.toLowerCase()))throw new Error('The Dataverse supplier services categories do not include Principal Contractor. Confirm the supplier category field before sending this report.');
 const source=[];let path=`accounts?$select=accountid,name,${field}&$filter=bss_accounttype eq 760820001`;
 do{const page=await flowRequest(context.environment,context.token,path,{headers:{Prefer:'odata.maxpagesize=200'}});source.push(...(page.value || []));path=page['@odata.nextLink'] || '';}while(path);
 const accounts=[],db=base44.asServiceRole.entities;
 for(let offset=0;offset<source.length;offset+=100){
  const batch=source.slice(offset,offset+100),byId=new Map(batch.map(row=>[row.accountid.toLowerCase(),row]));let cursor;
  do{const page=await db.Account.filter({account_type:'supplier',dataverse_id:{$in:[...byId.keys()]}},{limit:100,cursor,fields:['name','dataverse_id']});
   for(const account of page.items){const row=byId.get(account.dataverse_id?.toLowerCase());if(!row)continue;
    const categories=String(row[field] ?? '').split(',').map(value=>value.trim()).filter(Boolean).map(value=>{const label=labels.get(value);if(!label)throw new Error('Dataverse returned an unrecognised supplier category. Refresh the category choices before sending the report.');return label.trim();});
    const category=categories.some(label=>label.toLowerCase()===principal.toLowerCase()) ? principal : categories.length ? categories.sort((a,b)=>a.localeCompare(b,'en-GB')).join(' / ') : 'Category not recorded';
    accounts.push({...account,dataverse_id:row.accountid.toLowerCase(),name:row.name || account.name,category,categories});
   }
   cursor=page.has_more ? page.next_cursor : undefined;
  }while(cursor);
 }
 return accounts;
}