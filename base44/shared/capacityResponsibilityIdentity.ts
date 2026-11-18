const clean=value=>String(value || '').trim().toLowerCase();
export async function capacityResponsibilityIdentity(db,user,references,read) {
  const ids=[...new Set(references.filter(Boolean))];
  const alternatives=[{portal_role:{$in:['bdm','bsm']}},...(ids.length ? [{aad_id:{$in:ids}},{dataverse_id:{$in:ids}},...(ids.some(id=>/^[a-f0-9]{24}$/i.test(id)) ? [{id:{$in:ids.filter(id=>/^[a-f0-9]{24}$/i.test(id))}}] : [])] : [])];
  const fields=['aad_id','dataverse_id','full_name','first_name','last_name','portal_role','alliance_bdm_reporting'];
  const [page,reporting]=await Promise.all([
    read('responsibility-identities:v4',()=>db.Contact.filter({status:{$ne:'inactive'},$or:alternatives},{limit:1000,fields})),
    ids.length ? read('responsibility-staff-links:v1',()=>db.StaffReportingLine.filter({source_matched:true,staff_aad_id:{$in:ids}},{limit:1000,fields:['staff_aad_id','contact_id']})) : {items:[]},
  ]);
  const contacts=new Map(page.items.map(contact=>[contact.id,contact]));
  const linkedIds=[...new Set(reporting.items.map(line=>line.contact_id).filter(id=>id && !contacts.has(id)))];
  const linked=linkedIds.length ? await read('responsibility-linked-contacts:v1',()=>db.Contact.filter({id:{$in:linkedIds},status:{$ne:'inactive'}},{limit:1000,fields})) : {items:[]};
  if([page,reporting,linked].some(result=>result.has_more))throw new Error('Responsibility identities exceed the reporting limit. Narrow the portfolio filters.');
  for(const contact of linked.items)contacts.set(contact.id,contact);
  const people=new Map(),byContact=new Map(),ambiguous=new Set();
  const addAlias=(value,person)=>{
    const id=clean(value);
    if(!id || ambiguous.has(id))return;
    const previous=people.get(id);
    if(previous && previous.key!==person.key){ambiguous.add(id);people.set(id,{key:id,name:'Ambiguous staff identity',resolved:false});}
    else if(!previous?.resolved || person.resolved)people.set(id,person);
  };
  for(const contact of contacts.values()){
    const name=contact.full_name || [contact.first_name,contact.last_name].filter(Boolean).join(' ');
    const person={key:clean(contact.aad_id || contact.id),name:name || 'Name unavailable',contactId:contact.id,role:contact.portal_role,allianceBdm:contact.alliance_bdm_reporting,resolved:!!name};
    byContact.set(contact.id,person);
    for(const id of [contact.id,contact.dataverse_id,contact.aad_id])addAlias(id,person);
  }
  // Reconcile verified Dataverse staff references with their linked contacts, never by name.
  for(const line of reporting.items){
    const contact=byContact.get(line.contact_id);
    if(contact?.resolved)addAlias(line.staff_aad_id,contact);
  }
  const ownIds=[user.id,user.staff_aad_id,user.data?.staff_aad_id,user.dataverse_systemuser_id,user.data?.dataverse_systemuser_id].filter(Boolean);
  const own=ownIds.map(id=>people.get(clean(id))).find(person=>person?.resolved) || {key:clean(user.id),name:user.full_name || 'You',role:user.role,resolved:!!user.full_name};
  for(const id of ownIds)people.set(clean(id),{...own,role:user.role});
  return {resolve:(id,role)=>people.get(clean(id)) || {key:clean(id),name:`Unresolved ${role || 'owner'} (${String(id).slice(-6)})`,resolved:false},ownKey:own.key,people};
}