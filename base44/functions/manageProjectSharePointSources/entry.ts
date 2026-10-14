import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';
import {projectSharePointReads} from '../../shared/projectSharePointReads.ts';
import {readPsoApprovals} from '../../shared/psoApprovalMapping.ts';
import {readLoiSources} from '../../shared/loiWordSelection.ts';
export default async function(req) {
 try {
  const base44=createClientFromRequest(req),user=await base44.auth.me();
  if(!user)return Response.json({error:'Unauthorized'},{status:401});
  if(user.role!=='admin')return Response.json({error:'Administrator access required.'},{status:403});
  const input=await req.json();
  if(typeof input.projectId!=='string' || input.projectId.length>80 || !['psoPreview','psoImport','loiSources'].includes(input.action))return Response.json({error:'Choose a project and a valid source action.'},{status:400});
  const project=await base44.entities.Project.get(input.projectId);
  if(!project)return Response.json({error:'Project not found.'},{status:404});
  const reads=await projectSharePointReads(base44);
  if(input.action==='loiSources') {
   const page=await base44.entities.LegalDocument.filter({project_id:{$in:[project.id,project.dataverse_id].filter(Boolean)},status:{$ne:'inactive'},document_type:{$in:['loi','LOI - Extension']},link_to_file:{$exists:true,$nin:[null,'']}},{limit:20,fields:['document_id','document_type','link_to_file']});
   if(page.has_more)throw new Error('More than 20 LOI records exist; narrow the project documents before checking sources.');
   return Response.json({sources:await readLoiSources(reads,project,page.items)});
  }
  if(!project.link_to_pso)return Response.json({error:'No PSO workbook linked to this project.'},{status:400});
  const result=await readPsoApprovals(reads,project.link_to_pso),importedFields=Object.keys(result.updates);
  if(input.action==='psoPreview')return Response.json({...result,importedFields});
  if(!importedFields.length)return Response.json({...result,importedFields});
  const {items}=await base44.entities.ProjectDelivery.filter({project_id:project.id},{sort:'-created_date',limit:1});
  const current=items[0],pso_workbook_fields=[...new Set([...(current?.pso_workbook_fields||[]),...importedFields])];
  const payload={...result.updates,pso_workbook_fields};
  if(current)await base44.entities.ProjectDelivery.update(current.id,payload);
  else await base44.entities.ProjectDelivery.create({...payload,project_id:project.id,client_account_id:project.client_account_id||null,bdm_aad_id:project.bdm_aad_id||null});
  return Response.json({...result,importedFields});
 }catch(error){return Response.json({error:error.message},{status:500});}
}