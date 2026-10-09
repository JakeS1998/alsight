import {flowRequest} from './dataverseFlowApi.ts';
import {isGuid} from './dataverseFlowFields.ts';
import {sourceKey} from './financeProjectMatching.ts';
const uniqueIds=(values,key)=>[...new Set(values.map(v=>v?.[key]).filter(isGuid))];
async function sourceRows(context,set,id,fields,ids){
 if(!ids.length)return [];
 const q=new URLSearchParams({'$select':[id,...fields].join(','),'$filter':ids.map(value=>`${id} eq ${value}`).join(' or '),'$top':'100'});
 const result=await flowRequest(context.environment,context.token,`${set}?${q}`);
 if(result['@odata.nextLink'])throw new Error('Commission references exceed the safe batch size.');
 return result.value||[];
}
export async function resolveCommissionReferences(base44,context,table,values){
 if(table!=='coms')return values;
 const suppliers=await sourceRows(context,'cr78c_suppliers','cr78c_supplierid',['cr78c_company_number','cr78c_name'],uniqueIds(values,'supplier_source_id'));
 const projects=await sourceRows(context,'cr78c_projectses','cr78c_projectsid',['cr78c_name','cr78c_reference'],uniqueIds(values,'project_source_id'));
 const conditions=suppliers.flatMap(s=>[...(s.cr78c_company_number?.trim()?[{company_number:s.cr78c_company_number.trim()}]:[]),...(s.cr78c_name?.trim()?[{name:s.cr78c_name.trim()}]:[])]);
 const accounts=conditions.length?await base44.entities.Account.filter({$or:conditions},{limit:200,fields:['name','company_number','dataverse_id']}):{items:[]};
 if(accounts.has_more)throw new Error('Too many supplier matches; review commission supplier identifiers.');
 const keyed=await Promise.all(projects.map(async p=>({...p,key:await sourceKey(`dataverse:${context.environment}`,p.cr78c_name||'',p.cr78c_reference||'')})));
 const mappings=keyed.length?await base44.entities.FinanceProjectMapping.filter({dataset_id:`dataverse:${context.environment}`,source_key:{$in:keyed.map(p=>p.key)}},{limit:100}):{items:[]};
 if(mappings.has_more)throw new Error('Duplicate finance project mappings need review.');
 return values.map(value=>{
  if(!value)return value;
  const s=suppliers.find(s=>s.cr78c_supplierid===value.supplier_source_id),p=keyed.find(p=>p.cr78c_projectsid===value.project_source_id);
  const number=s?.cr78c_company_number?.trim()||'';
  let matches=number?accounts.items.filter(a=>a.company_number===number):[];
  if(!matches.length&&s?.cr78c_name)matches=accounts.items.filter(a=>a.name===s.cr78c_name.trim());
  const account=matches.length===1?matches[0]:null;
  const mapping=mappings.items.find(m=>m.source_key===p?.key&&m.project_id);
  const reference=mapping?.project_code||(/^PROJ\d+$/i.test(p?.cr78c_reference||'')?p.cr78c_reference.toUpperCase():'');
  const rate=value.commission_rate;
  if(rate!=null&&(!Number.isFinite(rate)||rate<0||rate>100))throw new Error('Commission percentage must be between 0 and 100.');
  return {...value,account_id:account?.id||'',supplier_company_number:account?.company_number||number,project_ref:reference};
 });
}