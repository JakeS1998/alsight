import {projectAssignedStaff} from './projectAssignedStaff.ts';
export async function ieProjectOwners(base44,projects){
 const db=base44.asServiceRole.entities,ids=[...new Set(projects.map(p=>p.bdm_aad_id).filter(Boolean))];
 if(!ids.length)return new Map();
 const staff=await projectAssignedStaff(base44,ids);
 const contactIds=[...new Set(Object.values(staff.links).map(link=>link.split('/').pop()).filter(Boolean))];
 const contacts=contactIds.length?await db.Contact.filter({id:{$in:contactIds}},{limit:100,fields:['full_name','email','aad_id']}):{items:[]};
 const emails=contacts.items.map(c=>c.email?.trim().toLowerCase()).filter(Boolean);
 const users=await db.User.filter({$or:[{id:{$in:ids}},{staff_aad_id:{$in:ids}},{dataverse_systemuser_id:{$in:ids}},...(emails.length?[{email:{$in:emails}}]:[])]},'full_name',500);
 return new Map(projects.map(project=>{
  const identity=project.bdm_aad_id,contact=contacts.items.find(c=>c.id===staff.links[identity]?.split('/').pop());
  const person=users.find(u=>[u.id,u.staff_aad_id,u.dataverse_systemuser_id].includes(identity)||contact&&(u.id===contact.aad_id||u.email?.toLowerCase()===contact.email?.toLowerCase()));
  return [project.id,{owner_id:contact?.id||person?.id||identity||'',owner_name:staff.names[identity]||person?.full_name||'',user_id:person?.id||''}];
 }));
}