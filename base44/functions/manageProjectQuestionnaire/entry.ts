import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';
import {questionnaireVersion,questionnaireSections,questionnaireFields,missingQuestionnaireFields,questionnaireDefaults} from '../../shared/projectQuestionnaireTemplate.ts';
export default async function(req: Request): Promise<Response> {
 try {
  const base44=createClientFromRequest(req),user=await base44.auth.me();
  if(!user)return Response.json({error:'Unauthorized'},{status:401});
  if(!['admin','director','regional_director','bsm','finance','bdm'].includes(user.role))return Response.json({error:'Internal project access required.'},{status:403});
  const body=await req.json();
  if(!['load','save','submit','reopen'].includes(body.action)||typeof body.projectId!=='string'||!/^[a-f0-9]{24}$/i.test(body.projectId))return Response.json({error:'Choose a valid project and questionnaire action.'},{status:400});
  const project=await base44.entities.Project.get(body.projectId);
  if(!project||project.status==='inactive')return Response.json({error:'Project unavailable.'},{status:404});
  const canEdit=['admin','director','bdm','bsm'].includes(user.role);
  // Project is read with the caller's own permissions before accessing protected answers.
  const source=base44.asServiceRole.entities.ProjectQuestionnaire;
  const {items}=await source.filter({project_id:project.id},{limit:1,sort:'-created_date'}),current=items[0]||null;
  if(body.action==='load')return Response.json({record:current,sections:questionnaireSections,defaults:questionnaireDefaults(project),canEdit,templateVersion:questionnaireVersion,sourceProject:'Aberdare Lido · PROJ693',sourceUrl:project.link_to_project_questionnaire||null});
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
  if(current){await source.updateMany({project_id:project.id,revision:current.revision},{$set:payload});const {items:updated}=await source.filter({project_id:project.id},{limit:1});if(updated[0]?.save_token!==save_token)return Response.json({error:'Another person saved changes. Reload before continuing.'},{status:409});return Response.json({record:updated[0]});}
  return Response.json({record:await source.create({...payload,project_id:project.id})});
 }catch(error){return Response.json({error:error.message},{status:error.status||500});}
}