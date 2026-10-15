import { personalDataverseContext, getPersonalDataverseToken } from './dataverseUserAuth.ts';
import { flowRequest } from './dataverseFlowApi.ts';
import { flowSpecs, isName } from './dataverseFlowFields.ts';
import { flowSelection, mappedFlowValues } from './dataverseFlowValues.ts';
import { projectRequestValues, projectCreatePayload } from './projectCreateValues.ts';
import { resolveFlowStaffReferences } from './dataverseFlowStaffReferences.ts';
import { resolveFlowProjectReferences } from './dataverseProjectReferences.ts';
import { projectCounter, projectRoute, receiveProjectApproval } from './projectApprovalIntake.ts';
import {withPQCreationGate} from './pqCreationGate.ts';
async function submissionGuid(userId, requestId) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`ALSight:project-request:v1:${userId}:${requestId}`))).slice(0,16);
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map(value => value.toString(16).padStart(2,'0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
export async function createDataverseProject(base44,user,config,input){
 return await withPQCreationGate(base44,user,input,async gate=>{
  if(gate.existingProject){const approval=await receiveProjectApproval(base44,gate.existingProject.id);return {project:gate.existingProject,approval,notice:'This request has already created its project.'};}
  return await createApprovedDataverseProject(base44,user,config,{...input,values:gate.values},gate);
 });
}
async function createApprovedDataverseProject(base44, user, config, input, gate) {
  if (!flowSpecs.projects.writeRoles.includes(user.role)) { const error = new Error('Project request access required.'); error.status=403; throw error; }
  if (typeof input.requestId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(input.requestId)) throw new Error('Invalid project submission identity.');
  const values = projectRequestValues(input.values), settings = config?.tables?.projects;
  const brief = input.values.request_brief_file_uri;
  if (brief != null && (typeof brief !== 'string' || brief.length > 2000)) throw new Error('Invalid saved brief reference.');
  if (!isName(settings?.entitySet) || !isName(settings?.primaryId) || !settings.mappings?.length) throw new Error('Confirm the Dataverse project table mapping first.');
  await projectCounter(base44);
  const route = await projectRoute(base44);
  if (!route.enabled || !route.named_emails?.length) throw new Error('An administrator must enable the project approval route before submission.');
  const {environment, record} = await personalDataverseContext(base44,user);
  if (environment !== config.environment_url) throw new Error('Your Dataverse account uses a different environment.');
  const token = await getPersonalDataverseToken(base44,user,environment,record);
  const context = {environment,token,settings,spec:flowSpecs.projects};
  const sourceId = await submissionGuid('pq-gateway',gate.requestKey);
  const path = `${settings.entitySet}(${sourceId})?$select=${flowSelection(settings,'projects')}`;
  let source;
  try { source = await flowRequest(environment,token,path); }
  catch (error) { if (error.status !== 404) throw error; }
  if (!source) {
    const payload = await projectCreatePayload(base44,context,values);
    payload[settings.primaryId] = sourceId;
    try { await flowRequest(environment,token,settings.entitySet,{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)}); }
    catch (error) {
      // An ambiguous network result or concurrent retry must not insert a second row.
      try { source = await flowRequest(environment,token,path); } catch { throw error; }
    }
    source ||= await flowRequest(environment,token,path);
  }
  const db = base44.asServiceRole.entities;
  const existing = await db.Project.filter({dataverse_id:sourceId},{limit:2});
  if (existing.items.length > 1) throw new Error('Duplicate linked projects require administrator attention.');
  let project = existing.items[0];
  if (!project) {
    const mirror = {entities:db};
    const [resolved] = await resolveFlowStaffReferences(mirror,'projects',[mappedFlowValues('projects',settings,source)],context);
    if (resolved.error) throw new Error(resolved.error);
    const [local] = await resolveFlowProjectReferences(mirror,'projects',[resolved.value]);
    const result = await db.Project.upsert([{...local,dataverse_id:sourceId,status:local.status || 'active',...(brief ? {request_brief_file_uri:brief} : {})}],{key:'dataverse_id'});
    project = result.records[0];
  }
  // Attach the approved PQ and source before normal intake, preserving safe retries.
  await gate.attach(project);
  // Bulk upsert has no entity side effects; explicitly use the existing normal intake.
  const approval = await receiveProjectApproval(base44,project.id);
  if (approval.skipped) throw new Error('The project was created in Dataverse but approval setup needs administrator attention. Retry this same request after correction.');
  return {project:{...project,approval_status:approval.status==='approved'?'Approved':approval.status==='rejected'?'Rejected':'Approval Pending'},approval,notice:'Created in Dataverse and submitted through the normal project approval route.'};
}