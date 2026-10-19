import {ieError,ieText} from './ieAccess.ts';
import {ieDepartmentIds} from './ieDepartmentProjects.ts';
export async function ieMapDepartmentProjects(base44,user,input){
 if(user.role!=='admin')ieError('Administrator access required.',403);
 const db=base44.asServiceRole.entities,id=ieText(input.project_id,100);
 const page=await db.Project.filter({department_id:{$in:ieDepartmentIds},status:{$ne:'inactive'},...(id?{id}:{})},{sort:'id',limit:30,...(input.cursor?{cursor:ieText(input.cursor,4000)}:{})});
 if(!page.items.length)return {mapped:0,has_more:false};
 const projects=page.items,ids=projects.flatMap(p=>[p.id,p.dataverse_id].filter(Boolean));
 const accountIds=[...new Set(projects.flatMap(p=>[p.client_account_id,p.account_id].filter(Boolean)))];
 const staffIds=[...new Set(projects.map(p=>p.strategic_account_manager_aad_id).filter(Boolean))];
 const [linked,accounts,contacts,users]=await Promise.all([
  db.IEEngagement.filter({project_id:{$in:ids}},{distinct:'project_id',limit:1000}),
  accountIds.length?db.Account.filter({account_type:'client',$or:[{id:{$in:accountIds}},{dataverse_id:{$in:accountIds}}]},{limit:100}):{items:[]},
  staffIds.length?db.Contact.filter({$or:[{id:{$in:staffIds}},{aad_id:{$in:staffIds}},{dataverse_id:{$in:staffIds}}]},{limit:100}):{items:[]},
  staffIds.length?db.User.filter({$or:[{id:{$in:staffIds}},{staff_aad_id:{$in:staffIds}},{dataverse_systemuser_id:{$in:staffIds}}]},'full_name',500):[]
 ]);
 if(linked.has_more||accounts.has_more||contacts.has_more)ieError('The project mapping exceeds its lookup limit.');
 const mapped=new Set(linked.items),records=[];
 for(const p of projects){
  if(mapped.has(p.id)||p.dataverse_id&&mapped.has(p.dataverse_id))continue;
  const account=accounts.items.find(a=>[a.id,a.dataverse_id].includes(p.client_account_id))||accounts.items.find(a=>[a.id,a.dataverse_id].includes(p.account_id));
  const staff=p.strategic_account_manager_aad_id;
  const contact=staff?contacts.items.find(c=>[c.id,c.aad_id,c.dataverse_id].includes(staff)):null;
  const person=staff?users.find(u=>[u.id,u.staff_aad_id,u.dataverse_systemuser_id].includes(staff)||contact?.aad_id===u.id):null;
  const completed=p.practical_completion_date?.slice(0,10)||'';
  records.push({reference:`IE-PROJECT-${p.id}`,name:p.name,client_id:account?.id||'',client_name:account?.name||p.client_name||'',project_id:p.id,project_name:p.name,owner_id:contact?.id||person?.id||'',owner_name:contact?.full_name||person?.full_name||'',team_ids:[],team:[],access_user_ids:person?[person.id]:[],bsm_identity:p.bsm_aad_id||'',region_id:p.department_id||'',status:completed?'completed':p.live_project?'live':'scoping',priority:'normal',start_date:p.ie_commencement_date?.slice(0,10)||'',completion_date:completed,description:p.description||'',notes_risks:p.ie_comments||'',awaiting_action:false,revision:1,origin:'project_department'});
 }
 if(records.length)await db.IEEngagement.upsert(records,{key:'reference'});
 return {mapped:records.length,has_more:page.has_more,next_cursor:page.next_cursor};
}