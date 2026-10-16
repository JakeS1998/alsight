import {ieError,ieText,ieEscape,ieRoles,ieIdentity} from './ieAccess.ts';
export async function ieLookup(base44,user,input){
 const db=base44.asServiceRole.entities,kind=input.kind,search=ieText(input.search,100),cursor=ieText(input.cursor,4000),opts={limit:30,sort:'name',...(cursor?{cursor}:{})};
 const match=field=>search?{[field]:{$regex:ieEscape(search),$options:'i'}}:{};
 if(kind==='people'){
  const users=await db.User.filter({role:{$in:['sam','sam_director']}},'full_name',200);
  return {items:users.map(u=>({id:u.id,name:u.full_name||u.email,role:u.role})),has_more:false};
 }
 if(kind==='client')return db.Account.filter({account_type:'client',status:{$ne:'inactive'},...match('name')},{...opts,fields:['name']});
 if(!['project','opportunity'].includes(kind))ieError('Unknown relationship type.');
 const clientId=ieText(input.client_id,100);if(!clientId)return {items:[],has_more:false};
 const account=await db.Account.get(clientId);if(account.account_type!=='client')ieError('Choose an existing client.');
 if(kind==='project'){
  const conditions=[{status:{$ne:'inactive'}},{$or:[{client_account_id:{$in:[account.id,account.dataverse_id].filter(Boolean)}},{account_id:{$in:[account.id,account.dataverse_id].filter(Boolean)}}]},match('name')];
  return db.Project.filter({$and:conditions},{...opts,fields:['name','project_number','site_postcode','client_name']});
 }
 // Opportunity RLS remains authoritative. SAMs do not inherit other BDMs' private opportunity access.
 const query={$and:[{account_id:{$in:[account.id,account.dataverse_id].filter(Boolean)}},match('title')]};
 const page=await base44.entities.Opportunity.filter(query,{...opts,sort:'title',fields:['title','account_id']});
 return {...page,items:page.items.map(row=>({...row,name:row.title}))};
}
export async function ieLinkedProject(base44,user,input){
 if(!['admin','sam_director'].includes(user.role))ieError('SAM Director project access required.',403);
 const id=ieText(input.project_id,100),db=base44.asServiceRole.entities;
 const project=await db.Project.get(id);
 const linked=await db.IEEngagement.count({project_id:id});
 if(!linked&&!project.strategic_account_manager_aad_id)ieError('This is not a SAM-linked project.',403);
 return {project:Object.fromEntries(['id','name','project_number','client_name','description','department_id','site_postcode','live_project','status','practical_completion_date','ie_commencement_date'].map(key=>[key,project[key]]))};
}