import {projectCounter} from './projectApprovalIntake.ts';
import {withProjectNumberLease} from './projectNumberLease.ts';
export async function projectNumberAdmin(base44,user,input) {
 if(user.role!=='admin')throw new Error('Administrator access required.');
 const db=base44.asServiceRole.entities;
 if(input.action==='counter'){
  const row=await projectCounter(base44),history=await db.ProjectNumberChange.filter({},{sort:'-changed_at',limit:10});
  return {lastUsed:row.last_used,prefix:row.prefix,lastProjectNumber:`${row.prefix}${row.last_used}`,history:history.items};
 }
 if(!Number.isSafeInteger(input.lastUsed) || input.lastUsed<0 || input.lastUsed>999999999 || !Number.isSafeInteger(input.expectedLastUsed) || typeof input.reason!=='string' || !input.reason.trim() || input.reason.length>1000)throw new Error('Enter a valid whole-number counter and a reason for the change.');
 return withProjectNumberLease(base44,async(row,assertLease)=>{
  if(row.last_used!==input.expectedLastUsed)throw new Error('The counter changed while you were editing. Reload it before saving.');
  if(row.last_used===input.lastUsed)return {notice:'The counter is unchanged.'};
  await assertLease();
  await db.ProjectNumberChange.create({previous_number:row.last_used,last_used:input.lastUsed,reason:input.reason.trim(),changed_by_id:user.id,changed_by_name:user.full_name || user.email,changed_at:new Date().toISOString()});
  await db.ProjectNumberCounter.update(row.id,{last_used:input.lastUsed,changed_by:user.id,changed_at:new Date().toISOString()});
  return {notice:'Counter updated. Existing project numbers are unchanged; duplicate numbers will be blocked.'};
 });
}