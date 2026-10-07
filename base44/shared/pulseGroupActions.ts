import {text,internalRoles} from './allianceLayerAccess.ts';
import {groupCreators,pulseGroupAccess,internalGroupMember} from './pulseGroupAccess.ts';
import {withPortalUserNames} from './portalUserNames.ts';
export async function managePulseGroups(base44,user,input) {
  const db=base44.asServiceRole.entities,action=input.action;
  if(action==='groups') {
    const page=await db.AlliancePulseGroup.filter({member_ids:user.id},{sort:'name',limit:50,...(input.cursor ? {cursor:input.cursor} : {})});
    return {...page,can_create:groupCreators.includes(user.role)};
  }
  if(action==='groupCreate') {
    if(!groupCreators.includes(user.role)) throw new Error('Only admins, directors and regional directors can create groups.');
    return {group:await db.AlliancePulseGroup.create({name:text(input.name,100,true),description:text(input.description || '',500),owner_id:user.id,member_ids:[user.id]})};
  }
  if(action==='groupPeople') {
    await pulseGroupAccess(base44,user,input.groupId,true);
    const offset=Number(input.offset || 0);
    if(!Number.isInteger(offset) || offset<0 || offset>10000) throw new Error('Invalid colleague page.');
    const query={role:{$in:internalRoles}},search=text(input.search || '',80);
    if(search) {
      const match={$regex:search.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),$options:'i'};
      const contacts=await db.Contact.filter({status:{$ne:'inactive'},$or:[{full_name:match},{first_name:match},{last_name:match}]},{limit:50,fields:['aad_id','email','email2','email3']});
      const ids=contacts.items.map(contact=>contact.aad_id).filter(Boolean);
      const emails=contacts.items.flatMap(contact=>[contact.email,contact.email2,contact.email3]).filter(Boolean).map(email=>email.trim().toLowerCase());
      query.$or=[{full_name:match},{email:match},...(ids.length ? [{id:{$in:ids}},{staff_aad_id:{$in:ids}}] : []),...(emails.length ? [{email:{$in:emails}}] : [])];
    }
    const people=await db.User.filter(query,'full_name',31,offset);
    const named=await withPortalUserNames(db,people.slice(0,30));
    return {items:named.map(person=>({id:person.id,full_name:person.full_name || person.email,role:person.role})),has_more:people.length>30};
  }
  const group=await pulseGroupAccess(base44,user,input.groupId,!['groupMembers','groupLeave'].includes(action));
  if(action==='groupMembers') {
    const offset=Number(input.offset || 0);
    if(!Number.isInteger(offset) || offset<0 || offset>200) throw new Error('Invalid member page.');
    const ids=group.member_ids.slice(offset,offset+10),items=[];
    for(let index=0;index<ids.length;index+=5) {
      const people=await Promise.all(ids.slice(index,index+5).map(id=>db.User.get(id)));
      items.push(...people.filter(person=>person && internalRoles.includes(person.role)));
    }
    const named=await withPortalUserNames(db,items);
    return {items:named.map(person=>({id:person.id,full_name:person.full_name || person.email,role:person.role})),next_offset:offset+10,has_more:offset+10<group.member_ids.length};
  }
  if(action==='groupLeave') {
    if(group.owner_id===user.id) throw new Error('Assign a new owner before leaving this group.');
    await db.AlliancePulseGroup.update(group.id,{member_ids:group.member_ids.filter(id=>id!==user.id)});
    return {left:true};
  }
  if(action==='groupMemberRemove') {
    if(input.personId===group.owner_id) throw new Error('The owner cannot be removed. Transfer ownership first.');
    return {group:await db.AlliancePulseGroup.update(group.id,{member_ids:group.member_ids.filter(id=>id!==input.personId)})};
  }
  if(!['groupMemberAdd','groupOwner'].includes(action)) throw new Error('Unsupported group operation.');
  const person=await internalGroupMember(base44,input.personId),members=[...new Set([...group.member_ids,person.id])];
  if(members.length>200) throw new Error('This group has reached its 200-member limit.');
  return {group:await db.AlliancePulseGroup.update(group.id,{member_ids:members,...(action==='groupOwner' ? {owner_id:person.id} : {})})};
}