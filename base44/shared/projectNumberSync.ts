export async function advanceSyncedProjectCounter(base44,counter,project,assertLease) {
 if(!project.dataverse_id || typeof project.project_number!=='string')return false;
 const value=project.project_number.trim(),prefix=counter.prefix;
 if(value.slice(0,prefix.length).toUpperCase()!==prefix.toUpperCase())return false;
 const suffix=value.slice(prefix.length);
 if(!/^\d+$/.test(suffix))return false;
 const number=Number(suffix);
 if(!Number.isSafeInteger(number) || number>999999999 || number<=counter.last_used)return false;
 await assertLease();
 const result=await base44.asServiceRole.entities.ProjectNumberCounter.updateMany({id:counter.id,lease_token:counter.lease_token,lease_until:{$gt:new Date().toISOString()},last_used:counter.last_used},{$max:{last_used:number},$set:{changed_by:'dataverse_sync',changed_at:new Date().toISOString()}});
 if(!result.updated)throw new Error('The project counter changed during Dataverse sync. Please retry the sync.');
 return true;
}