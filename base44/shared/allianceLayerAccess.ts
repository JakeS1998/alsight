export const internalRoles=['admin','director','regional_director','bsm','finance','bdm'];
export const themes=['Health & wellbeing','Community','Place','Inclusion','Sustainability','Social value'];
export const stages=['','Scope','Fee','Prepare','Design','Programme','Act','Decide','De-risk','Build','Handover'];
export const pulseTypes=['Project milestone','Team recognition','Project win','Impact','Knowledge','Team news','New project','Completion','Client success'];
export function text(value,max,required=false) {
  if(typeof value!=='string' || value.length>max || (required && !value.trim())) throw new Error('Please complete the required fields within their length limits.');
  return value.trim();
}
export async function projectAccess(base44,id) {
  if(typeof id!=='string' || !/^[a-f0-9]{24}$/i.test(id)) throw new Error('Invalid project selection.');
  const project=await base44.entities.Project.get(id);
  if(!project || project.status==='inactive') throw new Error('No matching accessible project.');
  return project;
}
export async function allowedLessons(base44,items) {
  const ids=[...new Set(items.map(item=>item.project_id))];
  if(!ids.length) return [];
  const page=await base44.entities.Project.filter({id:{$in:ids},status:{$ne:'inactive'}},{limit:50,fields:['name']});
  const projects=new Map(page.items.map(project=>[project.id,project]));
  return items.filter(item=>projects.has(item.project_id)).map(item=>({...item,project_name:projects.get(item.project_id).name,href:`/projects/${item.project_id}?tab=general&lesson=${item.id}#project-lessons`}));
}
export async function linkedRecord(base44,kind,id) {
  if(kind==='none') return {href:null,label:null};
  if(typeof id!=='string' || !/^[a-f0-9]{24}$/i.test(id)) throw new Error('Invalid linked record.');
  if(kind==='project') { const p=await projectAccess(base44,id);return {href:`/projects/${p.id}?tab=general`,label:p.name}; }
  if(kind==='person') { const p=await base44.entities.Contact.get(id);if(!p) throw new Error('No matching accessible person.');return {href:`/people/${p.id}`,label:p.full_name}; }
  if(kind==='lesson') { const lesson=await base44.asServiceRole.entities.AllianceLesson.get(id);const visible=await allowedLessons(base44,[lesson]);if(!visible.length) throw new Error('No matching accessible lesson.');return {href:visible[0].href,label:visible[0].project_name}; }
  throw new Error('Invalid linked record type.');
}
export async function allowedPulse(base44,items) {
  const lessonIds=[...new Set(items.filter(i=>i.related_entity_type==='lesson').map(i=>i.related_entity_id))];
  const lessons=lessonIds.length ? (await base44.asServiceRole.entities.AllianceLesson.filter({id:{$in:lessonIds}},{limit:50})).items : [];
  const projectIds=[...new Set([...items.filter(i=>i.related_entity_type==='project').map(i=>i.related_entity_id),...lessons.map(l=>l.project_id)])];
  const personIds=[...new Set(items.filter(i=>i.related_entity_type==='person').map(i=>i.related_entity_id))];
  const projects=projectIds.length ? (await base44.entities.Project.filter({id:{$in:projectIds},status:{$ne:'inactive'}},{limit:50,fields:['name']})).items : [];
  const people=personIds.length ? (await base44.entities.Contact.filter({id:{$in:personIds}},{limit:50,fields:['full_name']})).items : [];
  const pMap=new Map(projects.map(p=>[p.id,p])),cMap=new Map(people.map(p=>[p.id,p])),lMap=new Map(lessons.map(l=>[l.id,l]));
  return items.flatMap(item=>{
    const kind=item.related_entity_type,id=item.related_entity_id;
    if(kind==='none') return [{...item,href:null,label:null}];
    if(kind==='project' && pMap.has(id)) return [{...item,href:`/projects/${id}?tab=general`,label:pMap.get(id).name}];
    if(kind==='person' && cMap.has(id)) return [{...item,href:`/people/${id}`,label:cMap.get(id).full_name}];
    const lesson=lMap.get(id);
    if(kind==='lesson' && lesson && pMap.has(lesson.project_id)) return [{...item,href:`/projects/${lesson.project_id}?tab=general&lesson=${id}#project-lessons`,label:pMap.get(lesson.project_id).name}];
    return [];
  });
}