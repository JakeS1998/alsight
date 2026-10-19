import {ieScope,ieIdentity,ieText,ieEscape,ieError} from './ieAccess.ts';
export const ieDepartmentIds=['881a8516-e30b-f111-8407-7ced8d390a61','Insights & Engagement'];
export async function ieDepartmentProjects(base44,user,input){
 const db=base44.asServiceRole.entities;
 const parts=[{department_id:{$in:ieDepartmentIds}},{status:{$ne:'inactive'}}];
 // Preserve Project RLS for existing project roles. SAM access is limited to
 // their own assignments or engagements; SAM Directors already oversee I&E.
 let entity=base44.entities.Project;
 if(user.role==='sam_director')entity=db.Project;
 if(user.role==='sam'){
  entity=db.Project;
  const linked=await db.IEEngagement.filter({$and:[ieScope(user),{project_id:{$exists:true,$nin:[null,'']}}]},{distinct:'project_id',limit:1000});
  if(linked.has_more)ieError('The I&E project access scope exceeds the reporting limit.');
  parts.push({$or:[{strategic_account_manager_aad_id:{$in:ieIdentity(user)}},{id:{$in:linked.items}}]});
 }
 const fields=['name','project_number','client_name','description','department_id','site_postcode','live_project','status','practical_completion_date','ie_commencement_date','dataverse_id'];
 if(input.action==='departmentProject'){
  const id=ieText(input.project_id,100);if(!id)ieError('Choose an I&E project.');
  const page=await entity.filter({id,$and:parts},{limit:1,fields});
  if(!page.items.length)ieError('I&E project unavailable or access denied.',403);
  const project=page.items[0];
  const engagements=await db.IEEngagement.filter({$and:[ieScope(user),{project_id:{$in:[project.id,project.dataverse_id].filter(Boolean)}}]},{limit:1,fields:['name']});
  return {project,engagement_id:engagements.items[0]?.id||''};
 }
 const search=ieText(input.search,100);
 if(search)parts.push({$or:['name','project_number','client_name'].map(field=>({[field]:{$regex:ieEscape(search),$options:'i'}}))});
 return entity.filter({$and:parts},{sort:'name',limit:30,fields,...(input.cursor?{cursor:ieText(input.cursor,4000)}:{})});
}