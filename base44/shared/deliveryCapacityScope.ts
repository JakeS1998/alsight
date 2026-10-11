export const capacityRoles = ['admin','director','regional_director','bdm','bsm','finance'];
export const managementRoles = ['admin','director','regional_director'];
export async function capacityScope(db, user, input) {
  const contacts = await db.Contact.filter({ aad_id: user.id }, { limit: 50, fields: ['id','dataverse_id','aad_id'] });
  const identity = [...new Set([user.id,user.staff_aad_id,user.data?.staff_aad_id,user.dataverse_systemuser_id,user.data?.dataverse_systemuser_id,...contacts.items.flatMap(c=>[c.id,c.dataverse_id,c.aad_id])].filter(Boolean))];
  const assigned = { $or: ['project_manager_id','bdm_aad_id','bsm_aad_id','director_aad_id','strategic_account_manager_aad_id'].map(field=>({[field]:{$in:identity}})) };
  const clauses = [{status:{$ne:'inactive'}},{live_project:true},{approval_status:{$nin:['complete','completed']}},{$or:[{practical_completion_date:{$exists:false}},{practical_completion_date:{$in:[null,'']}},{practical_completion_date:{$gte:new Date().toISOString().slice(0,10)}}]}];
  if (user.role==='regional_director') clauses.push({department_id:user.region || user.data?.region || '__unassigned_region__'});
  if (user.role==='bsm') clauses.push({bsm_aad_id:{$in:[...identity,user.delegate_of,user.data?.delegate_of].filter(Boolean)}});
  if (user.role==='bdm') clauses.push({$or:['bdm_aad_id','bsm_aad_id'].map(field=>({[field]:{$in:[...identity,user.delegate_of,user.data?.delegate_of].filter(Boolean)}}))});
  if (Array.isArray(input.projectIds)) clauses.push({id:{$in:input.projectIds.length ? input.projectIds : ['__empty_selection__']}});
  if (input.personal && !managementRoles.includes(user.role)) clauses.push(assigned);
  return {query:{$and:clauses},identity};
}