import { assignmentFields } from './deliveryCapacitySignals.ts';
export async function capacityPeople(db, user, rows) {
  const ids=[...new Set(rows.flatMap(p=>assignmentFields.map(field=>p[field])).filter(Boolean))];
  if(!ids.length)return new Map();
  const result=await db.Contact.filter({$or:['id','dataverse_id','aad_id'].map(field=>({[field]:{$in:ids}}))},{limit:1000,fields:['id','dataverse_id','aad_id','full_name','first_name','last_name']});
  if(result.has_more)throw new Error('Assignment identities exceed the reporting limit. Narrow the portfolio filters.');
  const people=new Map();
  for(const contact of result.items){const person={key:contact.id,name:contact.full_name || [contact.first_name,contact.last_name].filter(Boolean).join(' ') || 'Assigned person',contactId:contact.id,resolved:true};for(const id of [contact.id,contact.dataverse_id,contact.aad_id].filter(Boolean))people.set(id,person);}
  // User reads remain user-scoped: photos are included only where the existing User permissions permit them.
  if(user.role==='admin') {
    const users=await db.User.filter({$or:[{id:{$in:ids}},{staff_aad_id:{$in:ids}},{dataverse_systemuser_id:{$in:ids}}]});
    for(const member of users){const keys=[member.id,member.staff_aad_id,member.dataverse_systemuser_id].filter(Boolean);const existing=keys.map(id=>people.get(id)).find(Boolean);const person=existing || {key:member.id,name:member.full_name || 'Assigned person',resolved:true};person.photo={id:member.id,full_name:person.name,profile_picture_uri:member.profile_picture_uri};keys.forEach(id=>people.set(id,person));}
  }
  for(const id of [user.id,user.staff_aad_id,user.data?.staff_aad_id,user.dataverse_systemuser_id].filter(Boolean)){const person=people.get(id) || {key:user.id,name:user.full_name || 'You',resolved:true};person.photo={id:user.id,full_name:person.name,profile_picture_uri:user.profile_picture_uri};people.set(id,person);}
  return people;
}