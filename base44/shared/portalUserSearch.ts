import {staffEmailQuery} from './staffReportingIdentity.ts';
export async function portalUserSearch(db,search) {
 if(!search.trim())return {};
 const pattern={$regex:search.trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),$options:'i'},emails=new Set();let cursor;
 do {
  const page=await db.Contact.filter({status:{$ne:'inactive'},full_name:pattern},{limit:100,cursor,fields:['email','email2','email3']});
  for(const contact of page.items)for(const email of [contact.email,contact.email2,contact.email3])if(email)emails.add(email.trim().toLowerCase());
  cursor=page.has_more ? page.next_cursor : null;
 }while(cursor);
 return {$or:[{full_name:pattern},{email:pattern},...[...emails].map(email=>({email:staffEmailQuery(email)}))]};
}