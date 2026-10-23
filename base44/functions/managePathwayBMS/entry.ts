import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { pathwayBmsCatalog, pathwayBmsVersion } from '../../shared/pathwayBmsCatalog.ts';
import { bmsFail, bmsLinkedRecord, readBmsReviews, bmsExistingMatches } from '../../shared/pathwayBmsRecords.ts';
import { saveBmsReview } from '../../shared/pathwayBmsSave.ts';
import { pathwayBmsFacts } from '../../shared/pathwayBmsFacts.ts';
export default async function(req) {
 try {
  const base44=createClientFromRequest(req),user=await base44.auth.me();
  if(!user)return Response.json({error:'Sign in first.'},{status:401});
  if(!['admin','director','regional_director','bdm','bsm','finance'].includes(user.role))bmsFail('This BMS workspace is for the internal project team.',403);
  if(req.method!=='POST')bmsFail('POST required.',405);
  const raw=await req.text();if(raw.length>14000)bmsFail('Request too large.');
  const input=JSON.parse(raw);
  if(typeof input.projectId!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(input.projectId))bmsFail('Choose a project.');
  const project=await base44.entities.Project.get(input.projectId);
  if(!project)bmsFail('Project unavailable.',404);
  if(input.action==='search') {
   const task=pathwayBmsCatalog.find(t=>t.key===input.requirementKey);
   if(!task||task.source)bmsFail('Choose a requirement without an existing source.');
   const entity=input.entity==='ProjectDecision'?'ProjectDecision':input.entity==='ProjectAction'?'ProjectAction':null;
   if(!entity||(task.gate&&entity!=='ProjectDecision'))bmsFail('Choose the appropriate existing register.');
   if(typeof input.search!=='string'||input.search.length>150)bmsFail('Search up to 150 characters.');
   const title=entity==='ProjectAction'?'action':'decision_title',query={project_id:project.id};
   if(input.search.trim())query[title]={$regex:input.search.trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),$options:'i'};
   const page=await base44.entities[entity].filter(query,{sort:'-updated_date',limit:20,...(typeof input.cursor==='string'?{cursor:input.cursor}:{})});
   return Response.json({...page,items:page.items.map(row=>bmsLinkedRecord(entity,row,task.gate))});
  }
  if(input.action==='save')return Response.json({review:await saveBmsReview(base44,user,project,input)});
  if(input.action!=='read')bmsFail('Choose read, search or save.');
  const reviews=await readBmsReviews(base44.asServiceRole.entities,project.id);
  const [matches,facts]=await Promise.all([bmsExistingMatches(base44,project.id,reviews),pathwayBmsFacts(base44,project)]);
  return Response.json({catalog:pathwayBmsCatalog,version:pathwayBmsVersion,reviews,matches,facts,canEdit:['admin','director','bdm','bsm'].includes(user.role),canAssessGates:['admin','director'].includes(user.role)});
 }catch(error){return Response.json({error:error.message},{status:error.status||500});}
}