import {fail,pqRoles} from './pqApprovalCommon.ts';
import {withPortalUserNames} from './portalUserNames.ts';
import {portalUserSearch} from './portalUserSearch.ts';
export async function pqApprovalPeople(db,search){
 if(typeof search!=='string'||search.trim().length<2||search.length>80)fail('Enter at least two characters to find an approver.');
 const users=await db.User.filter({role:{$in:pqRoles},...await portalUserSearch(db,search)},'full_name',20);
 return (await withPortalUserNames(db,users)).filter(person=>person.email).map(person=>({id:person.id,name:person.full_name||person.email,email:person.email}));
}
export async function resolvePQApprovers(db,steps){
 if(!Array.isArray(steps)||steps.length<1||steps.length>10||steps.some(id=>typeof id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(id))||new Set(steps).size!==steps.length)fail('Choose one to ten different registered approvers in order.');
 const users=await Promise.all(steps.map(id=>db.User.get(id)));
 if(users.some(person=>!person?.email||!pqRoles.includes(person.role)))fail('Every approver must be a registered internal app user.');
 const named=await withPortalUserNames(db,users);
 return named.map(person=>({user_id:person.id,name:person.full_name||person.email,email:person.email.toLowerCase(),status:'waiting'}));
}