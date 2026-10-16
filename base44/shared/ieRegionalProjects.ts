import {ieError} from './ieAccess.ts';
export async function ieRegionalProjects(base44,user){
 if(user.role!=='regional_director')return user;
 const region=user.region||user.data?.region;
 if(!region)return {...user,ieRegionalProjectIds:[]};
 const page=await base44.asServiceRole.entities.Project.filter({department_id:region},{limit:1000,fields:['dataverse_id']});
 if(page.has_more)ieError('The regional project scope exceeds the reporting limit. Please contact an administrator.');
 return {...user,ieRegionalProjectIds:[...new Set(page.items.flatMap(project=>[project.id,project.dataverse_id]).filter(Boolean))]};
}