import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';
import {refreshSubmittedProjectValue} from '../../shared/submittedProjectValue.ts';
import {backfillProjectValues} from '../../shared/backfillProjectValues.ts';
export default async function(req) {
 try {
  const base44=createClientFromRequest(req),user=await base44.auth.me();
  if(!user)return Response.json({error:'Sign in required'},{status:401});
  const input=await req.json();
  if(input.action==='backfill') {if(user.role!=='admin')return Response.json({error:'Forbidden'},{status:403});return Response.json(await backfillProjectValues(base44));}
  const refs=[input.projectId,input.previousProjectId].filter(Boolean);
  if(refs.some(ref=>typeof ref!=='string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(ref)) || (input.proposalId && (typeof input.proposalId!=='string' || !/^[a-f0-9]{24}$/i.test(input.proposalId))))return Response.json({error:'Invalid project selection'},{status:400});
  if(!refs.length && !input.proposalId)return Response.json({error:'A project or proposal is required'},{status:400});
  if(!['admin','director','regional_director','bsm','finance','bdm'].includes(user.role))return Response.json({error:'Forbidden'},{status:403});
  const conditions=refs.map(ref=>/^[a-f0-9]{24}$/i.test(ref) ? {id:ref} : {dataverse_id:ref});
  if(input.proposalId)conditions.push({submitted_proposal_id:input.proposalId});
  const projects=new Map();
  for(const condition of conditions){const page=await base44.entities.Project.filter(condition,{limit:5,fields:['dataverse_id','estimated_value','full_value','submitted_proposal_value','submitted_proposal_id']});for(const project of page.items)projects.set(project.id,project);}
  const results=[];for(const project of projects.values())results.push(await refreshSubmittedProjectValue(base44,project));
  return Response.json({results});
 }catch(error){return Response.json({error:error.message},{status:500});}
}