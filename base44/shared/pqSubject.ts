import {projectRequestValues} from './projectCreateValues.ts';
import {fail,hash} from './riskApprovalData.ts';
const validId=value=>typeof value==='string'&&/^[a-f0-9]{24}$/i.test(value);
export const pqSubjectQuery=subject=>subject.pq_query||{project_id:subject.id};
export const pqSubjectLinks=subject=>({...pqSubjectQuery(subject),scope_key:subject.scope_key||subject.id});
export const pqMaterialHash=values=>hash(JSON.stringify(['name','client_account_id','description','estimated_value','site_postcode'].map(key=>[key,values[key]??null])));
export async function pqDraftAccess(base44,user,id){
 if(!validId(id))fail('Choose a saved project request.');
 const draft=await base44.asServiceRole.entities.ProjectRequestDraft.get(id);
 if(!draft||(draft.owner_id!==user.id&&user.role!=='admin'))fail('This project request is not available to you.',403);
 return draft;
}
export async function resolvePQSubject(base44,user,input){
 const keys=['projectId','opportunityId','requestDraftId'].filter(key=>input[key]!=null);
 if(keys.length!==1||!validId(input[keys[0]]))fail('Choose one project, opportunity or saved project request.');
 if(input.projectId){const project=await base44.entities.Project.get(input.projectId);if(!project||project.status==='inactive')fail('Project unavailable.',404);return {...project,scope_key:project.id,pq_query:{project_id:project.id},subject_type:'project'};}
 if(input.opportunityId){
  const item=await base44.entities.Opportunity.get(input.opportunityId);if(!item)fail('Opportunity unavailable.',404);
  const account=await base44.entities.Account.get(item.account_id);if(!account||account.account_type!=='client')fail('The opportunity needs an available client account.');
  const values=projectRequestValues({name:item.title,description:item.scope_summary||item.project_details||'',client_account_id:account.dataverse_id||account.id,bdm_aad_id:item.owner_id||undefined,client_rep_id:item.contact_id||undefined,estimated_value:item.confirmed_project_value??item.budget,site_postcode:item.site_postcode||undefined});
  return {id:item.id,name:item.title,project_number:`OPP-${item.id.slice(-8).toUpperCase()}`,client_name:account.name,description:values.description,client_objectives:item.client_objectives||'',scope_key:`opportunity:${item.id}`,pq_query:{opportunity_id:item.id},subject_type:'opportunity',creation_values:values,context_hash:await pqMaterialHash(values),source:item,created_project_id:item.project_id||null};
 }
 const draft=await pqDraftAccess(base44,user,input.requestDraftId);
 return {id:draft.id,name:draft.name,project_number:`REQ-${draft.id.slice(-8).toUpperCase()}`,client_name:draft.client_name||'',description:draft.values.description,scope_key:`request:${draft.id}`,pq_query:{request_draft_id:draft.id},subject_type:'request',creation_values:draft.values,context_hash:await pqMaterialHash(draft.values),source:draft,created_project_id:draft.project_id||null};
}