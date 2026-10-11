export const capacityRoles = ['admin','director','regional_director','bdm','bsm','finance'];
export const managementRoles = ['admin','director','regional_director'];
export async function capacityScope(db, user, input, totalScope=false) {
  const contacts = await db.Contact.filter({ aad_id: user.id }, { limit: 50, fields: ['id','dataverse_id','aad_id'] });
  const identity = [...new Set([user.id,user.staff_aad_id,user.data?.staff_aad_id,user.dataverse_systemuser_id,user.data?.dataverse_systemuser_id,...contacts.items.flatMap(c=>[c.id,c.dataverse_id,c.aad_id])].filter(Boolean))];
  const assigned = { $or: ['project_manager_id','bdm_aad_id','bsm_aad_id','director_aad_id','strategic_account_manager_aad_id'].map(field=>({[field]:{$in:identity}})) };
  const clauses = [{status:{$ne:'inactive'}},{live_project:true},{approval_status:{$nin:['complete','completed']}},{$or:[{practical_completion_date:{$exists:false}},{practical_completion_date:{$in:[null,'']}},{practical_completion_date:{$gte:new Date().toISOString().slice(0,10)}}]}];
  if (!totalScope && user.role==='regional_director') clauses.push({department_id:user.region || user.data?.region || '__unassigned_region__'});
  if (!totalScope && user.role==='bsm') clauses.push({bsm_aad_id:{$in:[...identity,user.delegate_of,user.data?.delegate_of].filter(Boolean)}});
  if (!totalScope && user.role==='bdm') clauses.push({$or:['bdm_aad_id','bsm_aad_id'].map(field=>({[field]:{$in:[...identity,user.delegate_of,user.data?.delegate_of].filter(Boolean)}}))});
  if (!totalScope && input.personal && !managementRoles.includes(user.role)) clauses.push(assigned);
  const filters=input.filters || {};
  if(filters.region)clauses.push({department_id:filters.region});
  if(filters.bdm)clauses.push({bdm_aad_id:filters.bdm});
  if(filters.status==='on_hold')clauses.push({live_project:false});
  if(filters.period){const year=new Date().getFullYear()-(new Date().getMonth()<3 ? 1 : 0)-(filters.period==='previous' ? 1 : 0);clauses.push({created_date:{$gte:`${year}-04-01`,$lt:`${year+1}-04-01`}});}
  // Keep built-in IDs at the top level; nested ID predicates are not reliably applied.
  return {query:{$and:clauses,...(!totalScope && Array.isArray(input.projectIds) ? {id:{$in:input.projectIds}} : {})},identity};
}