import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';
// Shared questionnaire includes separate CDM and Building Regulations Principal Designer fields.
import {questionnaireVersion,questionnaireSections,questionnaireFields,missingQuestionnaireFields,questionnaireDefaults} from '../../shared/projectQuestionnaireTemplate.ts';
import {pqRoles,withPQWriteLock} from '../../shared/pqApprovalCommon.ts';
import {pqRoundActions,pqProjectActions,pqRoundAction,pqProjectAction} from '../../shared/pqApprovalActions.ts';
import {resolvePQSubject,pqSubjectQuery,pqSubjectLinks,pqMaterialHash} from '../../shared/pqSubject.ts';
import {pqRequestDraftAction} from '../../shared/pqRequestDrafts.ts';
import {pqGatewayStatus} from '../../shared/pqGatewayStatus.ts';
import {projectRequestValues} from '../../shared/projectCreateValues.ts';
import {pqProjectLocked,pqRecordedApproval} from '../../shared/pqProjectLock.ts';
import {pqLegacyImport} from '../../shared/pqLegacyImport.ts';
import {pqPdf} from '../../shared/pqPdf.ts';
export default async function(req: Request): Promise<Response> {
 try {
  const base44=createClientFromRequest(req),user=await base44.auth.me();
  if(!user)return Response.json({error:'Unauthorized'},{status:401});
  if(!pqRoles.includes(user.role))return Response.json({error:'Internal project access required.'},{status:403});
  const body=await req.json();
  if(pqRoundActions.includes(body.action))return Response.json(await pqRoundAction(base44,user,body));
  if(['prepare_request','list_requests','load_request'].includes(body.action))return Response.json(await pqRequestDraftAction(base44,user,body));
  if(!['load','save','submit','reopen','gate','export_pdf',...pqProjectActions].includes(body.action))return Response.json({error:'Choose a valid questionnaire action.'},{status:400});
  const project=await resolvePQSubject(base44,user,body);
  let canEdit=['admin','director','bdm','bsm'].includes(user.role)&&!pqProjectLocked(project);
  // Project is read with the caller's own permissions before accessing protected answers.
  const source=base44.asServiceRole.entities.ProjectQuestionnaire,query=pqSubjectQuery(project);
  const peek=(await source.filter(query,{limit:1,fields:['scope_key']})).items[0];
  project.scope_key=peek?.scope_key||project.scope_key;
  const operation=async()=>{
  if(project.subject_type==='project'){const latest=await resolvePQSubject(base44,user,body);Object.assign(project,latest);canEdit=['admin','director','bdm','bsm'].includes(user.role)&&!pqProjectLocked(project);}
  const {items}=await source.filter(query,{limit:1,sort:'-created_date'});let current=items[0]||null;
  if(body.action==='load')current=await pqLegacyImport(base44,project,current,body.retryImport===true);
  if(body.action==='gate')return Response.json(await pqGatewayStatus(base44.asServiceRole.entities,project,current,body.values?await pqMaterialHash(projectRequestValues(body.values)):project.context_hash));
  if(pqProjectActions.includes(body.action))return Response.json(await pqProjectAction(base44,user,project,current,body));
  const approval=current?.approval_round_id?await base44.asServiceRole.entities.PQApprovalRound.get(current.approval_round_id):null;
  if(body.action==='export_pdf')return Response.json(pqPdf(project,current,approval));
  if(body.action==='load')return Response.json({record:current,approvalStatus:pqRecordedApproval(project)?.status||approval?.status||null,recordedApproval:pqRecordedApproval(project),locked:pqProjectLocked(project),sections:questionnaireSections,defaults:project.subject_type==='project'?{...questionnaireDefaults(project),pq_number:project.project_number||'',date:''}:questionnaireDefaults(project),canEdit,templateVersion:questionnaireVersion,sourceProject:'Aberdare Lido · PROJ693',sourceUrl:project.link_to_project_questionnaire||null});
  if(approval?.status==='active')return Response.json({error:'Withdraw the active approval sequence before reopening or changing this questionnaire.'},{status:409});
  if(!canEdit)return Response.json({error:'You can view this questionnaire but cannot edit it.'},{status:403});
  if(!Number.isInteger(body.revision)||body.revision!==(current?.revision||0))return Response.json({error:'This questionnaire has changed. Reload it before saving to avoid overwriting another person’s work.'},{status:409});
  if(body.action!=='reopen'&&current?.status==='submitted')return Response.json({error:'Reopen the submitted questionnaire before editing.'},{status:409});
  if(body.action==='reopen'&&current?.status!=='submitted')return Response.json({error:'Only a submitted questionnaire can be reopened.'},{status:400});
  let answers=current?.answers||{};
  if(body.action!=='reopen') {
   if(!body.answers||typeof body.answers!=='object'||Array.isArray(body.answers)||JSON.stringify(body.answers).length>120000)return Response.json({error:'Questionnaire answers are invalid or too long.'},{status:400});
   answers={};
   for(const field of questionnaireFields){const value=body.answers[field.id];if(value===undefined)continue;
    if(field.type==='checklist'){if(!Array.isArray(value)||value.length>field.options.length||value.some(item=>!field.options.includes(item)))return Response.json({error:`Invalid choice: ${field.label}`},{status:400});answers[field.id]=[...new Set(value)];}
    else {if(typeof value!=='string'||value.length>4000)return Response.json({error:`Invalid answer: ${field.label}`},{status:400});
     if(value&&field.type==='number'&&(!Number.isFinite(Number(value))||Number(value)<0))return Response.json({error:`Enter a non-negative number: ${field.label}`},{status:400});
     if(value&&field.type==='date'&&(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))))return Response.json({error:`Enter a valid date: ${field.label}`},{status:400});
     if(value&&field.type==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))return Response.json({error:`Enter a valid email: ${field.label}`},{status:400});
     if(value&&field.type==='select'&&!['Yes','No','N/A'].includes(value))return Response.json({error:`Invalid choice: ${field.label}`},{status:400});answers[field.id]=value;}
   }
  }
  const missing=missingQuestionnaireFields(answers);
  if(body.action==='submit'&&missing.length)return Response.json({error:'Complete the required fields before submitting.',missing},{status:400});
  const now=new Date().toISOString(),save_token=crypto.randomUUID();
  const payload={answers,template_version:questionnaireVersion,status:body.action==='submit'?'submitted':'draft',revision:(current?.revision||0)+1,save_token,saved_by:user.full_name||user.email,saved_at:now,...(body.action==='submit'?{submitted_at:now,submitted_by:user.full_name||user.email}:{})};
  if(current){await source.updateMany({...query,revision:current.revision},{$set:payload});const {items:updated}=await source.filter(query,{limit:1});if(updated[0]?.save_token!==save_token)return Response.json({error:'Another person saved changes. Reload before continuing.'},{status:409});return Response.json({record:updated[0]});}
  return Response.json({record:await source.create({...payload,...pqSubjectLinks(project)})});
  };
  const importsSource=body.action==='load'&&project.subject_type==='project'&&!!project.link_to_project_questionnaire;
  return ['load','approval_state','recipients','gate','export_pdf'].includes(body.action)&&!importsSource?await operation():await withPQWriteLock(base44.asServiceRole.entities,project.scope_key,operation);
 }catch(error){return Response.json({error:error.message},{status:error.status||500});}
}