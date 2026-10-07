import {text,stages,pulseTypes,themes,projectAccess,linkedRecord} from './allianceLayerAccess.ts';
import {secrets} from 'base44:runtime';
import {pulseGroupAccess} from './pulseGroupAccess.ts';
import {validateMentions} from './pulseMentions.ts';
export async function addLesson(base44,user,input) {
  const project=await projectAccess(base44,input.projectId),value=input.lesson || {};
  if(!stages.includes(value.pathway_stage || '') || !['','RIBA 0','RIBA 1','RIBA 2','RIBA 3','RIBA 4','RIBA 5','RIBA 6','RIBA 7'].includes(value.riba_stage || '')) throw new Error('Choose a recognised stage.');
  const lesson={project_id:project.id,region:project.department_id || '',pathway_stage:value.pathway_stage || '',riba_stage:value.riba_stage || '',project_type:text(value.project_type || '',100),theme:text(value.theme || '',100),author_id:user.id,author_name:user.full_name || 'Alliance colleague'};
  for(const key of ['what_happened','what_worked','what_didnt','what_we_would_do_differently','what_we_should_repeat']) lesson[key]=text(value[key] || '',2000,key==='what_happened');
  return {item:await base44.asServiceRole.entities.AllianceLesson.create(lesson)};
}
export async function addPulse(base44,user,input) {
  const value=input.item || {};
  const group=value.group_id ? await pulseGroupAccess(base44,user,value.group_id) : null;
  if(!pulseTypes.includes(value.type) || !['none','project','person','lesson'].includes(value.related_entity_type)) throw new Error('Choose a recognised update and record type.');
  if(value.type==='Company Update' && (!['admin','director','regional_director'].includes(user.role) || group)) throw new Error('Only administrators, directors and regional directors can share company updates with All Alliance.');
  if(value.is_story && value.related_entity_type==='none') throw new Error('An Alliance Story must link to an existing record.');
  await linkedRecord(base44,value.related_entity_type,value.related_entity_id);
  const mentions=await validateMentions(base44,value,group);
  const images=value.images || [],prefix=`mp/private/${secrets.get('BASE44_APP_ID')}/`;
  if(!Array.isArray(images) || images.length>4) throw new Error('Share up to four images per update.');
  const attachments=images.map(image=>{
    if(!image || typeof image.file_uri!=='string' || image.file_uri.length>500 || !image.file_uri.startsWith(prefix) || !/\.(png|jpe?g|webp|gif)$/i.test(image.file_uri)) throw new Error('Images must be uploaded privately to this app.');
    return {file_uri:image.file_uri,name:text(image.name || 'Shared Alliance image',200,true)};
  });
  return {item:await base44.asServiceRole.entities.AlliancePulseItem.create({type:value.type,title:text(value.title,200,true),summary:text(value.summary,1500,true),mentions,images:attachments,group_id:group?.id || '',related_entity_type:value.related_entity_type,related_entity_id:value.related_entity_type==='none' ? '' : value.related_entity_id,author_id:user.id,author_name:user.full_name || 'Alliance colleague',status:'published',is_story:!group && value.is_story===true})};
}
export async function removeItem(base44,user,input) {
  if(!['lesson','pulse'].includes(input.kind) || typeof input.id!=='string' || !/^[a-f0-9]{24}$/i.test(input.id)) throw new Error('Invalid item.');
  const entity=input.kind==='lesson' ? base44.asServiceRole.entities.AllianceLesson : base44.asServiceRole.entities.AlliancePulseItem;
  const item=await entity.get(input.id);
  if(!item) throw new Error('This item is not available.');
  const group=input.kind==='pulse' && item.group_id ? await pulseGroupAccess(base44,user,item.group_id) : null;
  if(item.author_id!==user.id && group?.owner_id!==user.id && !['admin','director'].includes(user.role)) throw new Error('You cannot remove this item.');
  if(input.kind==='lesson') await projectAccess(base44,item.project_id);else await linkedRecord(base44,item.related_entity_type,item.related_entity_id);
  if(input.kind==='pulse') await entity.update(item.id,{status:'archived'});else await entity.delete(item.id);
  return {removed:true};
}
export async function savePurpose(base44,user,input) {
  if(!['admin','director','bdm'].includes(user.role)) throw new Error('Project purpose editing is not permitted.');
  await projectAccess(base44,input.projectId);
  const value=input.purpose || {};
  if(!Array.isArray(value.impact_themes) || value.impact_themes.length>6 || value.impact_themes.some(theme=>!themes.includes(theme))) throw new Error('Choose recognised impact themes.');
  return {project:await base44.entities.Project.update(input.projectId,{why_this_matters:text(value.why_this_matters,4000),impact_themes:[...new Set(value.impact_themes)]})};
}