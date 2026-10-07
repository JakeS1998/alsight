import {internalRoles,text} from './allianceLayerAccess.ts';
import {pulseGroupAccess} from './pulseGroupAccess.ts';

export async function mentionPeople(base44,user,input) {
  const search=text(input.search || '',80),group=input.groupId ? await pulseGroupAccess(base44,user,input.groupId) : null;
  const query={role:{$in:internalRoles}};
  if(group) query.id={$in:group.member_ids};
  if(search) query.full_name={$regex:search.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),$options:'i'};
  const people=await base44.asServiceRole.entities.User.filter(query,'full_name',25);
  return {items:people.filter(person=>internalRoles.includes(person.role) && (!group || group.member_ids.includes(person.id))).map(person=>({user_id:person.id,name:(person.full_name || 'Alliance colleague').trim().slice(0,200)}))};
}

export async function validateMentions(base44,value,group) {
  const input=value.mentions || [];
  if(!Array.isArray(input) || input.length>10) throw new Error('Mention up to ten colleagues per post.');
  const ids=[...new Set(input.map(mention=>mention?.user_id))];
  if(ids.some(id=>typeof id!=='string' || !/^[a-f0-9]{24}$/i.test(id) || (group && !group.member_ids.includes(id)))) throw new Error('Choose colleagues who can view this post.');
  const mentions=[];
  for(let index=0;index<ids.length;index+=5) {
    const people=await Promise.all(ids.slice(index,index+5).map(id=>base44.asServiceRole.entities.User.get(id)));
    for(const person of people) {
      if(!person || !internalRoles.includes(person.role)) throw new Error('Choose an existing Alliance colleague.');
      const name=(person.full_name || 'Alliance colleague').trim().slice(0,200);
      if(typeof value.summary==='string' && value.summary.includes(`@${name}`)) mentions.push({user_id:person.id,name});
    }
  }
  return mentions;
}