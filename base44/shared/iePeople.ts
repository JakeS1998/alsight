import {ieError} from './ieAccess.ts';
const titles='^\\s*((business\\s+development\\s+manager|bdm)\\s*(and|&|\\+|/)\\s*)?(strategic\\s+account\\s+manager|sam|head\\s+of\\s+(insights?|engagement|enggement|engagment)(\\s*(and|&)\\s*(insights?|engagement))?)\\s*$';
export async function iePeople(db){
 const contacts=await db.Contact.filter({status:{$ne:'inactive'},$or:[{job_title:{$regex:titles,$options:'i'}},{dataverse_id:'6474e683-673a-f111-88b4-7ced8d390a61'}]},{sort:'full_name',limit:200,fields:['full_name','email','aad_id','portal_role','job_title']});
 if(contacts.has_more)ieError('The SAM directory needs another page.');
 const emails=contacts.items.map(c=>c.email?.trim().toLowerCase()).filter(Boolean);
 const users=await db.User.filter({$or:[{email:{$in:emails}},{role:{$in:['sam','sam_director']}}]},'full_name',500);
 const emailMap=new Map();for(const u of users){const email=u.email?.trim().toLowerCase();if(email){const matches=emailMap.get(email)||[];matches.push(u);emailMap.set(email,matches);}}
 const people=contacts.items.map(c=>{const matches=emailMap.get(c.email?.trim().toLowerCase())||[],u=matches.length===1?matches[0]:null;return {id:c.id,contact_id:c.id,name:c.full_name,job_title:c.job_title,user_id:u?.id||'',role:u?.role||'',linked:!!u};});
 const represented=new Set(people.map(p=>p.user_id).filter(Boolean));
 for(const u of users)if(['sam','sam_director'].includes(u.role)&&!represented.has(u.id))people.push({id:u.id,contact_id:'',name:u.full_name||u.email,user_id:u.id,role:u.role,linked:true,job_title:''});
 return people.sort((a,b)=>a.name.localeCompare(b.name));
}
export function iePersonMap(people){const map=new Map();for(const person of people){map.set(person.id,person);if(person.user_id)map.set(person.user_id,person);}return map;}
export function ieAccessUsers(people,ids){const map=iePersonMap(people);return [...new Set(ids.map(id=>map.get(id)?.user_id).filter(Boolean))];}
export async function ieLinkContactEngagements(db,contactId,userId){
 let page;do{page=await db.IEEngagement.updateMany({$and:[{$or:[{owner_id:contactId},{team_ids:contactId}]},{access_user_ids:{$nin:[userId]}}]},{$addToSet:{access_user_ids:userId},$inc:{revision:1}});}while(page.has_more);
}