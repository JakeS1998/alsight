import {allowedLessons,allowedPulse,projectAccess} from './allianceLayerAccess.ts';
import {pulseGroupAccess} from './pulseGroupAccess.ts';
import {insiderEngagement} from './insiderEngagement.ts';
export async function readLessons(base44,input) {
  const project=input.projectId ? await projectAccess(base44,input.projectId) : null;
  const related=[];
  if(project?.department_id) related.push({region:project.department_id});
  if(project?.impact_themes?.length) related.push({theme:{$in:project.impact_themes}});
  const query=input.related ? (related.length ? {$and:[{project_id:{$ne:project.id}},{$or:related}]} : {project_id:'__no_similarity_metadata__'}) : project ? {project_id:project.id} : {};
  if(input.search) query.what_happened={$regex:String(input.search).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),$options:'i'};
  const page=await base44.asServiceRole.entities.AllianceLesson.filter(query,{sort:'-created_date',limit:20,...(input.cursor ? {cursor:input.cursor} : {})});
  const items=await allowedLessons(base44,page.items);
  const total=project && !input.related ? await base44.asServiceRole.entities.AllianceLesson.count(query) : null;
  let focused=null;
  if(project && !input.related && !input.cursor && input.lessonId && !items.some(item=>item.id===input.lessonId)) {
    if(typeof input.lessonId!=='string' || !/^[a-f0-9]{24}$/i.test(input.lessonId)) throw new Error('Invalid lesson selection.');
    const selected=await base44.asServiceRole.entities.AllianceLesson.filter({id:input.lessonId,project_id:project.id},{limit:1});
    focused=(await allowedLessons(base44,selected.items))[0] || null;
  }
  return {items,total,focused,next_cursor:page.next_cursor,has_more:page.has_more};
}
export async function readImpact(base44,input) {
  if(!Array.isArray(input.projectIds) || input.projectIds.length>2000 || input.projectIds.some(id=>typeof id!=='string' || !/^[a-f0-9]{24}$/i.test(id))) throw new Error('Invalid portfolio selection.');
  const query={id:{$in:input.projectIds.length ? input.projectIds : ['000000000000000000000000']},status:{$ne:'inactive'}};
  const totals=await base44.entities.Project.aggregate({query,groupBy:'live_project',sum:'estimated_value'});
  if(totals.truncated) throw new Error('Impact totals are unavailable for this selection.');
  const completed=await base44.entities.Project.count({...query,practical_completion_date:{$exists:true,$nin:[null,''],$lte:new Date().toISOString()}});
  const valued=await base44.entities.Project.count({...query,estimated_value:{$gt:0}});
  const purposes=await base44.entities.Project.filter({...query,why_this_matters:{$exists:true,$nin:[null,'']}},{sort:'-updated_date',limit:6,fields:['name','why_this_matters','impact_themes']});
  return {projects:totals.rows.reduce((n,r)=>n+r.count,0),live:totals.rows.find(r=>r.live_project===true)?.count || 0,completed,estimatedInvestment:valued ? totals.rows.reduce((n,r)=>n+(r.sum_estimated_value || 0),0) : null,valuedProjects:valued,purposes:purposes.items};
}
export async function readHome(base44,input,user) {
  const group=input.groupId ? await pulseGroupAccess(base44,user,input.groupId) : null;
  const query={status:'published',group_id:group ? group.id : {$in:['',null]}};
  if(input.hashtag) {
    if(typeof input.hashtag!=='string' || !/^[A-Za-z0-9_]{1,80}$/.test(input.hashtag)) throw new Error('Choose a valid hashtag.');
    const match={$regex:`#${input.hashtag}(?![A-Za-z0-9_])`,$options:'i'};
    query.$or=[{title:match},{summary:match}];
  }
  const page=await base44.asServiceRole.entities.AlliancePulseItem.filter(query,{sort:'-created_date',limit:10,...(input.cursor ? {cursor:input.cursor} : {})});
  let pulse=await allowedPulse(base44,page.items,user);
  if(input.postId && !input.cursor) {
    if(typeof input.postId!=='string' || !/^[a-f0-9]{24}$/i.test(input.postId)) throw new Error('Invalid post selection.');
    const selected=await base44.asServiceRole.entities.AlliancePulseItem.get(input.postId);
    if(selected?.status==='published' && (selected.group_id || '')===(group?.id || '') && !pulse.some(item=>item.id===selected.id)) pulse=[...(await allowedPulse(base44,[selected],user)),...pulse];
  }
  if(group || input.cursor) return {pulse,group,engagement:await insiderEngagement(base44,user,pulse.map(item=>item.id)),impact:null,stories:[],lessons:[],milestones:[],next_cursor:page.next_cursor,has_more:page.has_more};
  const impact=await readImpact(base44,input);
  const curated=await base44.asServiceRole.entities.AlliancePulseItem.filter({status:'published',is_story:true,group_id:{$in:['',null]}},{sort:'-created_date',limit:4});
  const stories=await allowedPulse(base44,curated.items,user);
  const lessons=await readLessons(base44,{});
  const ids=input.projectIds.length ? input.projectIds : ['000000000000000000000000'];
  const milestones=await base44.entities.Project.filter({id:{$in:ids},status:{$ne:'inactive'},practical_completion_date:{$exists:true,$nin:[null,''],$lte:new Date().toISOString()}},{sort:'-practical_completion_date',limit:3,fields:['name','practical_completion_date']});
  const engagement=await insiderEngagement(base44,user,[...pulse.map(item=>item.id),...milestones.items.map(item=>`completion-${item.id}`),...lessons.items.slice(0,3).map(item=>`knowledge-${item.id}`)]);
  return {impact,pulse,stories,engagement,lessons:lessons.items.slice(0,3),milestones:milestones.items,userId:user.id,next_cursor:page.next_cursor,has_more:page.has_more};
}