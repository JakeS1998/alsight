import {uklfReportScope} from './uklfReportScope.ts';
import {workspaceFields,workspaceQuery,safeWorkspaceRow} from './frameworkWorkspaceRules.ts';
import {frameworkWorkspaceSummary} from './frameworkWorkspaceSummary.ts';
import {scopedReadCache,invalidateScopedRead} from './scopedReadCache.ts';
export async function frameworkWorkspace(base44,user,body) {
 const internal=user.role!=='framework_stakeholder',source=internal ? base44.entities.FrameworkProjectReport : base44.asServiceRole.entities.FrameworkProjectReport;
 const viewerKey=`framework:${user.id}:${user.role}`;
 const scope=await scopedReadCache(`${viewerKey}:scope`,()=>uklfReportScope(base44.asServiceRole.entities));
 const withinScope=record=>record && !Object.entries(scope).some(([field,rule])=>rule.$nin?.includes(record[field]));
 if(body.workspaceAction==='detail') {
  if(!/^[a-f0-9]{24}$/i.test(body.reportId || ''))return Response.json({error:'Invalid Framework record.'},{status:400});
  const record=await source.get(body.reportId);
  if(!withinScope(record))return Response.json({report:null});
  let project=null;
  if(record.project_id && /^[a-f0-9]{24}$/i.test(record.project_id))project=await base44.entities.Project.get(record.project_id).catch(()=>null);
  else if(record.project_id){const page=await base44.entities.Project.filter({dataverse_id:record.project_id},{limit:1,fields:['latitude','longitude']});project=page.items[0];}
  return Response.json({report:safeWorkspaceRow(record,project)});
 }
 if(body.workspaceAction==='link') {
  if(user.role!=='admin')return Response.json({error:'Only authorised Framework administrators can link records.'},{status:403});
  if(!/^[a-f0-9]{24}$/i.test(body.reportId || '') || !/^[a-f0-9]{24}$/i.test(body.projectId || ''))return Response.json({error:'Invalid record selection.'},{status:400});
  const [record,project]=await Promise.all([source.get(body.reportId),base44.entities.Project.get(body.projectId)]);
  if(!withinScope(record) || !project || project.procurement_route===false)return Response.json({error:'Select an accessible Framework project.'},{status:400});
  if(record.project_id)return Response.json({error:'This record is already linked. Refresh the workspace.'},{status:409});
  const duplicate=await source.count({project_id:project.id});if(duplicate)return Response.json({error:'That ALSight project is already linked to a Framework record.'},{status:409});
  await source.update(body.reportId,{project_id:project.id,project_number:project.project_number || ''});invalidateScopedRead('framework:');return Response.json({linked:true});
 }
 if(body.workspaceAction==='summary') {
  const days=[7,30,90].includes(body.days) ? body.days : 30;
  return Response.json(await scopedReadCache(`${viewerKey}:summary:fees:${days}:${JSON.stringify(scope)}`,()=>frameworkWorkspaceSummary(source,scope,internal,days)));
 }
 if(body.workspaceAction==='clients') {
  const term=String(body.term || '').slice(0,80).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return Response.json(await source.filter({$and:[scope,...(term ? [{client:{$regex:term,$options:'i'}}] : [])]},{distinct:'client',sort:'client',limit:50,...(body.cursor ? {cursor:body.cursor} : {})}));
 }
 const query=workspaceQuery(scope,body);
 const page=await source.filter(body.workspaceAction==='detail' ? {...scope,id:String(body.reportId || '')} : query,{sort:'-framework_ref',limit:body.workspaceAction==='detail' ? 1 : body.limit===10 ? 10 : 50,fields:workspaceFields,...(body.cursor ? {cursor:body.cursor} : {})});
 const ids=page.items.map(r=>r.project_id).filter(id=>typeof id==='string' && /^[a-f0-9]{24}$/i.test(id));
 const legacy=page.items.map(r=>r.project_id).filter(id=>typeof id==='string' && id && !/^[a-f0-9]{24}$/i.test(id));
 const projects=[];
 if(ids.length){const p=await base44.entities.Project.filter({id:{$in:ids}},{limit:50,fields:['project_number','latitude','longitude','dataverse_id']});projects.push(...p.items);}
 if(legacy.length){const p=await base44.entities.Project.filter({dataverse_id:{$in:legacy}},{limit:50,fields:['project_number','latitude','longitude','dataverse_id']});projects.push(...p.items);}
 const rows=page.items.map(r=>safeWorkspaceRow(r,projects.find(p=>p.id===r.project_id || p.dataverse_id===r.project_id)));
 if(body.workspaceAction==='detail')return Response.json({report:rows[0] || null});
 return Response.json({rows,next_cursor:page.next_cursor,has_more:page.has_more,count:await source.count(query)});
}