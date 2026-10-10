import {withPortalUserNames} from './portalUserNames.ts';
import {fullName,contactFullName,missingFullName} from './fullName.ts';
import {staffEmailQuery} from './staffReportingIdentity.ts';
const identity=value=>String(value || '').trim().toLowerCase();
const userRefs=user=>[user.id,user.staff_aad_id || user.data?.staff_aad_id,user.dataverse_systemuser_id || user.data?.dataverse_systemuser_id].map(identity);
export async function resolveApprovalRequesters(base44,projects) {
 if(projects.length>100)throw new Error('Resolve up to 100 project requesters at once.');
 const db=base44.asServiceRole.entities,refs=[...new Set(projects.map(p=>identity(p.bsm_aad_id)).filter(Boolean))];
 const result=new Map();
 if(!refs.length){for(const project of projects)result.set(project.id,{requested_by_name:'Project BSM not assigned',requested_by_role:'BSM',requested_by_email:''});return result;}
 const guids=refs.filter(id=>/^[0-9a-f-]{36}$/.test(id)),portalIds=refs.filter(id=>/^[0-9a-f]{24}$/.test(id));
 const [initial,contacts,staff]=await Promise.all([
  guids.length?db.User.filter({$or:[{staff_aad_id:{$in:guids}},{dataverse_systemuser_id:{$in:guids}}]},'full_name',500):[],
  db.Contact.filter({status:{$ne:'inactive'},$or:[{id:{$in:refs}},{dataverse_id:{$in:refs}},{aad_id:{$in:refs}}]},{limit:500,fields:['aad_id','dataverse_id','full_name','first_name','last_name','email']}),
  db.StaffReportingLine.filter({source_matched:true,staff_aad_id:{$in:refs}},{limit:500,fields:['staff_aad_id','staff_name','staff_email']})
 ]);
 const users=[...initial];
 for(let start=0;start<portalIds.length;start+=4){
  const batch=await Promise.allSettled(portalIds.slice(start,start+4).map(id=>db.User.get(id)));
  for(const item of batch){
   if(item.status==='rejected' && (item.reason?.response?.status || item.reason?.status)!==404)throw item.reason;
   if(item.status==='fulfilled' && item.value && !users.some(u=>u.id===item.value.id))users.push(item.value);
  }
 }
 const emails=[...new Set([...contacts.items.map(c=>identity(c.email)),...staff.items.map(s=>identity(s.staff_email))].filter(Boolean))];
 if(emails.length){const matched=await db.User.filter({$or:emails.map(email=>({email:staffEmailQuery(email)}))},'full_name',500);for(const person of matched)if(!users.some(u=>u.id===person.id))users.push(person);}
 const named=await withPortalUserNames(db,users);
 for(const project of projects){
  const ref=identity(project.bsm_aad_id),linkedContacts=contacts.items.filter(c=>[c.id,c.aad_id,c.dataverse_id].map(identity).includes(ref)),linkedStaff=staff.items.filter(s=>identity(s.staff_aad_id)===ref);
  const addresses=[...new Set([...linkedContacts.map(c=>identity(c.email)),...linkedStaff.map(s=>identity(s.staff_email))].filter(Boolean))];
  const direct=named.filter(u=>userRefs(u).includes(ref)),matches=direct.length?direct:named.filter(u=>addresses.includes(identity(u.email)));
  const person=matches.length===1?matches[0]:null;
  const names=[...new Set([...linkedContacts.map(contactFullName),...linkedStaff.map(s=>fullName(s.staff_name))].filter(n=>n!==missingFullName))];
  const name=person?fullName(person.full_name):names.length===1?names[0]:ref?'Project BSM not linked':'Project BSM not assigned';
  result.set(project.id,{requested_by_name:name.slice(0,200),requested_by_role:'BSM',requested_by_email:person?identity(person.email):''});
 }
 return result;
}
export async function refreshApprovalRequesters(base44,input) {
 if(input.cursor!==undefined && (typeof input.cursor!=='string' || input.cursor.length>2000))throw new Error('Invalid requester cursor.');
 const db=base44.asServiceRole.entities;
 const page=await db.DocumentApprovalRequest.filter({}, {sort:'created_date',limit:50,...(input.cursor?{cursor:input.cursor}:{}),fields:['project_id','project_number','bsm_aad_id','requested_by_name','requested_by_role','requested_by_email']});
 const ids=[...new Set(page.items.map(r=>r.project_id).filter(Boolean))],numbers=[...new Set(page.items.map(r=>r.project_number).filter(Boolean))];
 const projects=ids.length?(await db.Project.filter({$or:[{project_number:{$in:numbers}},{dataverse_id:{$in:ids}}]},{limit:100,fields:['dataverse_id','bsm_aad_id']})).items:[];
 const missing=ids.filter(id=>!projects.some(p=>p.id===id || p.dataverse_id===id)).filter(id=>/^[0-9a-f]{24}$/i.test(id));
 for(let start=0;start<missing.length;start+=4){const batch=await Promise.allSettled(missing.slice(start,start+4).map(id=>db.Project.get(id)));for(const item of batch){if(item.status==='fulfilled' && item.value)projects.push(item.value);else if(item.status==='rejected' && (item.reason?.response?.status || item.reason?.status)!==404)throw item.reason;}}
 const requesters=await resolveApprovalRequesters(base44,projects),changes=[];
 for(const request of page.items){
  const project=projects.find(p=>p.id===request.project_id || p.dataverse_id===request.project_id);
  const values=project?{...requesters.get(project.id),bsm_aad_id:project.bsm_aad_id || ''}:{requested_by_name:'Project BSM not linked',requested_by_role:'BSM',requested_by_email:''};
  if(Object.entries(values).some(([key,value])=>request[key]!==value))changes.push({id:request.id,...values});
 }
 if(changes.length)await db.DocumentApprovalRequest.bulkUpdate(changes);
 return {processed:page.items.length,updated:changes.length,has_more:page.has_more,next_cursor:page.next_cursor};
}