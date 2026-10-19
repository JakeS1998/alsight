import {ieError,ieText} from './ieAccess.ts';
import {ieDepartmentIds} from './ieDepartmentProjects.ts';
import {ieProjectOwners} from './ieProjectOwner.ts';
export async function ieMapDepartmentProjects(base44,user,input){
 if(user.role!=='admin')ieError('Administrator access required.',403);
 const db=base44.asServiceRole.entities,id=ieText(input.project_id,100);
 const page=await db.Project.filter({department_id:{$in:ieDepartmentIds},status:{$ne:'inactive'},...(id?{id}:{})},{sort:'id',limit:30,...(input.cursor?{cursor:ieText(input.cursor,4000)}:{})});
 if(!page.items.length)return {mapped:0,has_more:false};
 const projects=page.items,ids=projects.flatMap(p=>[p.id,p.dataverse_id].filter(Boolean));
 const accountIds=[...new Set(projects.flatMap(p=>[p.client_account_id,p.account_id].filter(Boolean)))];
 const [linked,accounts,owners]=await Promise.all([
  db.IEEngagement.filter({project_id:{$in:ids}},{limit:1000}),
  accountIds.length?db.Account.filter({account_type:'client',$or:[{id:{$in:accountIds}},{dataverse_id:{$in:accountIds}}]},{limit:100}):{items:[]},
  ieProjectOwners(base44,projects)
 ]);
 if(linked.has_more||accounts.has_more)ieError('The project mapping exceeds its lookup limit.');
 const records=[],updates=[];
 for(const p of projects){
  const owner=owners.get(p.id)||{owner_id:'',owner_name:'',user_id:''};
  const existing=linked.items.filter(item=>[p.id,p.dataverse_id].filter(Boolean).includes(item.project_id));
  if(existing.length){
   for(const item of existing)if(item.origin==='project_department'&&(item.owner_id!==owner.owner_id||item.owner_name!==owner.owner_name||owner.user_id&&!item.access_user_ids?.includes(owner.user_id)))updates.push({id:item.id,owner_id:owner.owner_id,owner_name:owner.owner_name,access_user_ids:[...new Set([...(item.access_user_ids||[]),owner.user_id].filter(Boolean))],revision:(item.revision||1)+1});
   continue;
  }
  const account=accounts.items.find(a=>[a.id,a.dataverse_id].includes(p.client_account_id))||accounts.items.find(a=>[a.id,a.dataverse_id].includes(p.account_id));
  const completed=p.practical_completion_date?.slice(0,10)||'';
  records.push({reference:`IE-PROJECT-${p.id}`,name:p.name,client_id:account?.id||'',client_name:account?.name||p.client_name||'',project_id:p.id,project_name:p.name,owner_id:owner.owner_id,owner_name:owner.owner_name,team_ids:[],team:[],access_user_ids:owner.user_id?[owner.user_id]:[],bsm_identity:p.bsm_aad_id||'',region_id:p.department_id||'',status:completed?'completed':p.live_project?'live':'scoping',priority:'normal',start_date:p.ie_commencement_date?.slice(0,10)||'',completion_date:completed,description:p.description||'',notes_risks:p.ie_comments||'',awaiting_action:false,revision:1,origin:'project_department'});
 }
 if(records.length)await db.IEEngagement.upsert(records,{key:'reference'});
 if(updates.length)await db.IEEngagement.bulkUpdate(updates);
 return {mapped:records.length,updated:updates.length,has_more:page.has_more,next_cursor:page.next_cursor};
}