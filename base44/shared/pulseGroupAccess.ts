import {internalRoles} from './allianceLayerAccess.ts';
export const groupCreators=['admin','director','regional_director'];
export function groupId(value) {
  if(typeof value!=='string' || !/^[a-f0-9]{24}$/i.test(value)) throw new Error('Invalid group selection.');
  return value;
}
export async function pulseGroupAccess(base44,user,id,ownerOnly=false) {
  const group=await base44.asServiceRole.entities.AlliancePulseGroup.get(groupId(id));
  if(!group || !internalRoles.includes(user.role) || !group.member_ids.includes(user.id) || (ownerOnly && group.owner_id!==user.id)) throw new Error('This private group is not available to you.');
  return group;
}
export async function internalGroupMember(base44,id) {
  const person=await base44.asServiceRole.entities.User.get(groupId(id));
  if(!person || !internalRoles.includes(person.role)) throw new Error('Choose an existing internal colleague.');
  return {id:person.id,full_name:person.full_name || person.email,role:person.role};
}