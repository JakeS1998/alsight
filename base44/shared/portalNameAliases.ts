import {withPortalUserNames} from './portalUserNames.ts';
const roles=['admin','director','regional_director','bsm','bdm','finance','project_manager'];
export async function portalNameAliases(base44,user) {
 const db=base44.asServiceRole.entities,aliases=[];
 if(!roles.includes(user.role)){const [named]=await withPortalUserNames(db,[user]);return [{full_name:named.full_name,aliases:[user.id,user.email,user.full_name].filter(Boolean)}];}
 let offset=0,more;
 do {
  const users=await db.User.filter({role:{$in:roles}},'full_name',50,offset),named=await withPortalUserNames(db,users);
  aliases.push(...named.map((person,index)=>({full_name:person.full_name,aliases:[person.id,person.email,users[index].full_name].filter(Boolean)})));
  more=users.length===50;offset+=50;
 }while(more);
 return aliases;
}