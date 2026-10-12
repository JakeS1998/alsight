import {commercialScopedEntity,commercialDistinct} from './commercialScopedEntity.ts';
export const commercialRoles=['admin','finance','director','regional_director','bdm','bsm'];
export async function commercialAccessScope(base44,user,state){
 if(!commercialRoles.includes(user.role))throw new Error('Commercial reporting access required.');
 const restricted=!['admin','finance','director'].includes(user.role);
 if(!restricted)return {client:base44,restricted:false,codes:null,projectIds:null};
 const identity=[...new Set([user.id,user.staff_aad_id,user.data?.staff_aad_id,user.dataverse_systemuser_id,user.data?.dataverse_systemuser_id,user.delegate_of,user.data?.delegate_of].filter(Boolean))];
 const roles=[user.role,...(user.duty_roles||user.data?.duty_roles||[])],rules=[];
 if(roles.includes('bdm'))rules.push({bdm_aad_id:{$in:identity}});
 if(roles.includes('bdm')||roles.includes('bsm'))rules.push({bsm_aad_id:{$in:identity}});
 if(user.role==='regional_director'){const regions=[user.region,user.data?.region,user.delegate_region,user.data?.delegate_region].filter(Boolean);rules.push({department_id:{$in:regions}});}
 // Project RLS remains authoritative; assignment filters also reject empty-identity matches.
 const projectIds=await commercialDistinct(base44.entities.Project,{$or:rules},'id');
 const entities={...base44.entities,Project:commercialScopedEntity(base44.entities.Project,{id:{$in:projectIds}})};
 const scope={restricted:true,projectIds,codes:[],keys:[]};
 if(state?.active_generation){
  const db=base44.asServiceRole.entities;
  const links=await db.FinanceProjectMapping.aggregate({query:{dataset_id:state.namespace,project_id:{$in:projectIds},status:{$in:['automatic','manual']}},groupBy:['source_key','source_code'],limit:1000});
  if(links.truncated)throw new Error('Commercial project links exceed the reporting limit.');
  scope.keys=links.rows.map(r=>r.source_key);scope.codes=[...new Set(links.rows.map(r=>String(r.source_code||'').trim().toUpperCase()).filter(Boolean))];
  const base={namespace:state.namespace,generation:state.active_generation},headers={...base,active:true,kind:{$in:['purchase_orders','sales_orders']},project_key:{$in:scope.keys}};
  const [parents,suppliers,customers]=await Promise.all([commercialDistinct(db.FinanceDataverseRecord,{...headers,kind:'purchase_orders'},'source_id'),commercialDistinct(db.FinanceDataverseRecord,headers,'supplier_source_id'),commercialDistinct(db.FinanceDataverseRecord,headers,'customer_source_id')]);
  entities.FinanceProjectMapping=commercialScopedEntity(db.FinanceProjectMapping,{dataset_id:state.namespace,project_id:{$in:projectIds},status:{$in:['automatic','manual']}});
  entities.FinanceDataverseRecord=commercialScopedEntity(db.FinanceDataverseRecord,{...base,$or:[{project_key:{$in:scope.keys},kind:{$in:['projects','purchase_orders','sales_orders','invoices']}},{kind:'line_items',parent_id:{$in:parents}},{kind:'suppliers',source_id:{$in:suppliers}},{kind:'customers',source_id:{$in:customers}}]});
 }
 const client={entities,asServiceRole:base44.asServiceRole,auth:base44.auth,financeScope:scope};
 return {...scope,client};
}