import {flowRequest} from './dataverseFlowApi.ts';
export async function directoryOptions(context,field,search='',selectedId=null) {
 const mapping=context.settings.mappings.find(m=>m.local===field&&m.write);
 const entity=mapping?.lookupTarget?.entity;
 const types={systemuser:['systemusers','systemuserid','fullname','isdisabled eq false'],contact:['contacts','contactid','fullname','statecode eq 0'],account:['accounts','accountid','name','statecode eq 0']};
 if(!types[entity])throw new Error('This directory field requires a supported Dataverse lookup.');
 const [set,id,name,active]=types[entity],escaped=search.replaceAll("'","''");
 const filter=selectedId ? `${id} eq ${selectedId}` : `${active}${search?` and contains(${name},'${escaped}')`:''}`;
 const result=await flowRequest(context.environment,context.token,`${set}?$select=${id},${name}&$filter=${encodeURIComponent(filter)}&$orderby=${name}&$top=50`);
 return {options:(result.value||[]).map(row=>({id:row[id],name:row[name]})),has_more:!!result['@odata.nextLink']};
}