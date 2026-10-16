import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';
import {projectSharePointReads} from '../../shared/projectSharePointReads.ts';
import {importProjectPso,checkOutstandingPso} from '../../shared/importProjectPso.ts';
import {scanLoiExpiry} from '../../shared/loiExpiryScan.ts';
import {startPsoScheduledSync,continuePsoScheduledSync} from '../../shared/psoScheduledSync.ts';
import {readLoiSources} from '../../shared/loiWordSelection.ts';
export default async function(req) {
 try {
  const base44=createClientFromRequest(req),user=await base44.auth.me();
  if(!user)return Response.json({error:'Unauthorized'},{status:401});
  if(user.role!=='admin')return Response.json({error:'Administrator access required.'},{status:403});
  const input=await req.json();
  if(input.action==='psoStart')return Response.json(await startPsoScheduledSync(base44.entities,input.allProjects===true));
  if(input.action==='psoContinue') {
   if(typeof input.stateId!=='string' || !/^[a-f0-9]{24}$/i.test(input.stateId) || typeof input.ticket!=='string' || input.ticket.length>80)return Response.json({error:'Valid PSO batch ticket required.'},{status:400});
   return Response.json(await continuePsoScheduledSync(base44.entities,await projectSharePointReads(base44),input.stateId,input.ticket));
  }
  if(input.action==='psoBatch') {
   if(input.cursor && (typeof input.cursor!=='string' || input.cursor.length>8000))return Response.json({error:'Invalid batch cursor.'},{status:400});
   return Response.json(await checkOutstandingPso(base44.entities,await projectSharePointReads(base44),input.cursor));
  }
  if(['loiExpiryScan','loiExpiryPreview'].includes(input.action)) {
   if(typeof input.documentId!=='string' || !/^[a-f0-9]{24}$/i.test(input.documentId))return Response.json({error:'Valid LOI required.'},{status:400});
   return Response.json(await scanLoiExpiry(base44,await projectSharePointReads(base44),input.documentId,input.action==='loiExpiryPreview'));
  }
  if(typeof input.projectId!=='string' || input.projectId.length>80 || !['psoPreview','psoImport','loiSources'].includes(input.action))return Response.json({error:'Choose a project and a valid source action.'},{status:400});
  const project=await base44.entities.Project.get(input.projectId);
  if(!project)return Response.json({error:'Project not found.'},{status:404});
  const reads=await projectSharePointReads(base44);
  if(input.action==='loiSources') {
   const page=await base44.entities.LegalDocument.filter({project_id:{$in:[project.id,project.dataverse_id].filter(Boolean)},status:{$ne:'inactive'},document_type:{$in:['loi','LOI - Extension']},link_to_file:{$exists:true,$nin:[null,'']}},{limit:20,fields:['document_id','document_type','link_to_file']});
   if(page.has_more)throw new Error('More than 20 LOI records exist; narrow the project documents before checking sources.');
   return Response.json({sources:await readLoiSources(reads,project,page.items)});
  }
  return Response.json(await importProjectPso(base44.entities,reads,project,input.action==='psoPreview'));
 }catch(error){return Response.json({error:error.message},{status:500});}
}