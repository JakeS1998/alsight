import {staffEmailQuery} from './staffReportingIdentity.ts';
export const meetingAssignments={bdm_aad_id:'BDM',bsm_aad_id:'BSM',director_aad_id:'Director',strategic_account_manager_aad_id:'Strategic account manager',project_manager_id:'Project manager',client_rep_id:'Client representative',client_rep2_id:'Client representative',contractor_contact_id:'Contractor contact'};
export function meetingAttendees(event){
 return (event.attendees||[]).filter(a=>a.type!=='resource'&&a.status?.response!=='declined').slice(0,40).map(a=>({name:a.emailAddress?.name||'',address:a.emailAddress?.address||''}));
}
export async function meetingProjectContext(base44,input,user){
 if(!Array.isArray(input.attendees)||input.attendees.length>40||input.attendees.some(a=>!a||typeof a.name!=='string'||a.name.length>200||typeof a.address!=='string'||a.address.length>254)||input.cursor!==undefined&&(typeof input.cursor!=='string'||input.cursor.length>4000))throw Object.assign(new Error('Choose a meeting with up to 40 attendees.'),{status:400});
 const attendees=input.attendees.filter(a=>(a.name.trim()||a.address.trim())&&(!user?.email||a.address.trim().toLowerCase()!==user.email.trim().toLowerCase()));
 const empty={items:[],total:0,has_more:false,next_cursor:null,unmatchedAttendees:attendees.map(a=>a.name||a.address),contactsLimited:false};
 if(!attendees.length)return empty;
 const conditions=attendees.flatMap(a=>[...(a.address?['email','email2','email3'].map(field=>({[field]:staffEmailQuery(a.address)})):[]),...(a.name.trim().split(/\s+/).length>1?[{full_name:staffEmailQuery(a.name)}]:[])]);
 if(!conditions.length)return empty;
 const contacts=await base44.entities.Contact.filter({status:{$ne:'inactive'},$or:conditions},{limit:100,fields:['full_name','email','email2','email3','aad_id','dataverse_id']});
 const normal=value=>String(value||'').trim().toLowerCase(),people=[],unmatched=[];
 for(const attendee of attendees){
  const exact=attendee.address?contacts.items.filter(p=>[p.email,p.email2,p.email3].some(email=>normal(email)&&normal(email)===normal(attendee.address))):[];
  const named=contacts.items.filter(p=>normal(p.full_name)===normal(attendee.name));
  const matches=exact.length?exact:named.length===1?named:[];
  if(!matches.length){unmatched.push(attendee.name||attendee.address);continue;}
  people.push({name:matches[0].full_name,contactId:matches[0].id,basis:exact.length?'Attendee email':'Unique full name',aliases:[...new Set(matches.flatMap(p=>[p.id,p.aad_id,p.dataverse_id]).filter(Boolean))]});
 }
 const ids=[...new Set(people.flatMap(p=>p.aliases))];
 if(!ids.length)return {...empty,contactsLimited:contacts.has_more};
 const query={status:{$ne:'inactive'},live_project:true,$or:Object.keys(meetingAssignments).map(field=>({[field]:{$in:ids}}))};
 const [page,total]=await Promise.all([base44.entities.Project.filter(query,{limit:8,sort:'name',fields:['name','project_number','client_name','description',...Object.keys(meetingAssignments)],...(input.cursor?{cursor:input.cursor}:{})}),base44.entities.Project.count(query)]);
 const items=page.items.map(project=>{
  const matches=people.flatMap(person=>Object.entries(meetingAssignments).filter(([field])=>person.aliases.includes(project[field])).map(([,assignment])=>({name:person.name,contactId:person.contactId,assignment,basis:person.basis})));
  return {id:project.id,name:project.name,number:project.project_number,client:project.client_name,description:String(project.description||'').slice(0,600),matches};
 });
 return {items,total,has_more:page.has_more,next_cursor:page.next_cursor||null,unmatchedAttendees:unmatched,contactsLimited:contacts.has_more};
}