import {internalRoles,text} from './allianceLayerAccess.ts';
import {pulseGroupAccess} from './pulseGroupAccess.ts';
import {withPortalUserNames} from './portalUserNames.ts';

export async function mentionPeople(base44,user,input) {
  const search=text(input.search || '',80),group=input.groupId ? await pulseGroupAccess(base44,user,input.groupId) : null;
  const query={role:{$in:internalRoles}};
  if(group) query.id={$in:group.member_ids};
  const db=base44.asServiceRole.entities;
  if(search) {
    const pattern={$regex:search.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),$options:'i'};
    const contacts=await db.Contact.filter({status:{$ne:'inactive'},$or:[{full_name:pattern},{first_name:pattern},{last_name:pattern}]},{limit:50,fields:['aad_id','email','email2','email3']});
    const ids=contacts.items.map(contact=>contact.aad_id).filter(Boolean);
    const emails=contacts.items.flatMap(contact=>[contact.email,contact.email2,contact.email3]).filter(Boolean).map(email=>email.trim().toLowerCase());
    query.$or=[{full_name:pattern},...(ids.length ? [{id:{$in:ids}},{staff_aad_id:{$in:ids}}] : []),...(emails.length ? [{email:{$in:emails}}] : [])];
  }
  const people=await db.User.filter(query,'full_name',25);
  const named=await withPortalUserNames(db,people.filter(person=>internalRoles.includes(person.role) && (!group || group.member_ids.includes(person.id))));
  return {items:named.map(person=>({user_id:person.id,name:(person.full_name || 'Alliance colleague').trim().slice(0,200)}))};
}

export async function validateMentions(base44,value,group) {
  const input=value.mentions || [];
  if(!Array.isArray(input) || input.length>10) throw new Error('Mention up to ten colleagues per post.');
  const ids=[...new Set(input.map(mention=>mention?.user_id))];
  if(ids.some(id=>typeof id!=='string' || !/^[a-f0-9]{24}$/i.test(id) || (group && !group.member_ids.includes(id)))) throw new Error('Choose colleagues who can view this post.');
  const users=[];
  for(let index=0;index<ids.length;index+=5) {
    users.push(...await Promise.all(ids.slice(index,index+5).map(id=>base44.asServiceRole.entities.User.get(id))));
  }
  if(users.some(person=>!person || !internalRoles.includes(person.role))) throw new Error('Choose an existing Alliance colleague.');
  const people=await withPortalUserNames(base44.asServiceRole.entities,users);
  return people.flatMap(person=>{
    const name=(person.full_name || 'Alliance colleague').trim().slice(0,200);
    return typeof value.summary==='string' && value.summary.includes(`@${name}`) ? [{user_id:person.id,name}] : [];
  });
}