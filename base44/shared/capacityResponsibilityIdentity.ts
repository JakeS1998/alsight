const clean=value=>String(value || '').trim().toLowerCase();
export async function capacityResponsibilityIdentity(db,user,references,read) {
  const ids=[...new Set(references.filter(Boolean))];
  const alternatives=[{portal_role:{$in:['bdm','bsm']}},...(ids.length ? [{aad_id:{$in:ids}},{dataverse_id:{$in:ids}},...(ids.some(id=>/^[a-f0-9]{24}$/i.test(id)) ? [{id:{$in:ids.filter(id=>/^[a-f0-9]{24}$/i.test(id))}}] : [])] : [])];
  const page=await read('responsibility-identities:v1',()=>db.Contact.filter({status:{$ne:'inactive'},$or:alternatives},{limit:1000,fields:['aad_id','dataverse_id','full_name','first_name','last_name','portal_role']}));
  if(page.has_more)throw new Error('Responsibility identities exceed the reporting limit. Narrow the portfolio filters.');
  const people=new Map();
  for(const contact of page.items){
    const name=contact.full_name || [contact.first_name,contact.last_name].filter(Boolean).join(' ');
    const person={key:clean(contact.aad_id || contact.id),name:name || 'Name unavailable',contactId:contact.id,role:contact.portal_role,resolved:!!name};
    for(const id of [contact.id,contact.dataverse_id,contact.aad_id].filter(Boolean)){
      const previous=people.get(clean(id));
      people.set(clean(id),previous && previous.key!==person.key ? {key:clean(id),name:'Ambiguous staff identity',resolved:false} : person);
    }
  }
  const ownIds=[user.id,user.staff_aad_id,user.data?.staff_aad_id,user.dataverse_systemuser_id,user.data?.dataverse_systemuser_id].filter(Boolean);
  const own=ownIds.map(id=>people.get(clean(id))).find(person=>person?.resolved) || {key:clean(user.id),name:user.full_name || 'You',role:user.role,resolved:!!user.full_name};
  for(const id of ownIds)people.set(clean(id),{...own,role:user.role});
  return {resolve:(id,role)=>people.get(clean(id)) || {key:clean(id),name:`Unresolved ${role || 'owner'} (${String(id).slice(-6)})`,resolved:false},ownKey:own.key,people};
}