import {createClientFromRequest} from 'npm:@base44/sdk@0.8.54';
import {directoryFields,canEditDirectory} from '../../shared/projectDirectoryFields.ts';
import {flowConfig} from '../../shared/dataverseFlowApi.ts';
import {writeFlowContext,loadFlowRecord,saveFlowRecord} from '../../shared/dataverseFlowWrite.ts';
import {directoryOptions} from '../../shared/projectDirectoryOptions.ts';
import {isGuid} from '../../shared/dataverseFlowFields.ts';
export default async function(req: Request): Promise<Response> {
 try {
  const b=createClientFromRequest(req),user=await b.auth.me().catch(e=>e.status===401?null:Promise.reject(e));
  if(!user)return Response.json({error:'Sign in required.'},{status:401});
  const input=await req.json().catch(()=>({}));
  if(!['read','options','save'].includes(input.action)||typeof input.projectId!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(input.projectId))return Response.json({error:'Choose a project and directory operation.'},{status:400});
  const project=await b.entities.Project.get(input.projectId).catch(e=>[403,404].includes(e.status)?null:Promise.reject(e));
  if(!project)return Response.json({error:'Project outside your accessible portfolio.'},{status:403});
  const db=b.asServiceRole.entities;
  if(input.action==='read') {const page=await db.ProjectDirectoryAssignment.filter({project_id:project.id},{limit:20});return Response.json({assignments:page.items,editable:Object.keys(directoryFields).filter(f=>canEditDirectory(user.role,f))});}
  if(!Object.prototype.hasOwnProperty.call(directoryFields,input.field))return Response.json({error:'Choose a directory field.'},{status:400});
  if(!canEditDirectory(user.role,input.field))return Response.json({error:'Your role cannot change this directory field.'},{status:403});
  if(input.search!=null&&(typeof input.search!=='string'||input.search.length>100))return Response.json({error:'Search is limited to 100 characters.'},{status:400});
  if(input.action==='save'&&(typeof input.selectedId!=='string'||(input.selectedId&&!/^[a-zA-Z0-9_-]{1,64}$/.test(input.selectedId))))return Response.json({error:'Choose a valid assignment.'},{status:400});
  const local=directoryFields[input.field],config=await flowConfig(b),mapping=config?.tables?.projects?.mappings?.find(m=>m.local===local);
  if(local&&isGuid(project.dataverse_id)) {
   if(!mapping)throw new Error('This Dataverse directory column must be mapped before it can be edited.');
   const context=await writeFlowContext(b,user,config,{action:'load',table:'projects',recordId:project.id});
   if(input.action==='options'){const [options,record]=await Promise.all([directoryOptions(context,local,input.search||''),loadFlowRecord(context)]);return Response.json({...options,etag:record.etag,dataverse:true});}
   if(input.selectedId&&!isGuid(input.selectedId))return Response.json({error:'Choose a Dataverse assignment.'},{status:400});
   if(input.selectedId&&!(await directoryOptions(context,local,'',input.selectedId)).options.length)return Response.json({error:'Assignment unavailable in Dataverse.'},{status:400});
   const saved=await saveFlowRecord(b,context,{etag:input.etag,values:{[local]:input.selectedId}});
   return Response.json({project:saved.record,notice:saved.notice,refreshRequired:saved.refreshRequired});
  }
  const staff=['BDM','BSM','Director'].includes(input.field),contact=['Project Manager','Client Representative'].includes(input.field),entity=staff?'User':contact?'Contact':'Account';
  const source=staff?db.User:b.entities[entity],nameField=staff?'full_name':contact?'full_name':'name';
  if(input.action==='options') {const query=input.search?{[nameField]:{$regex:input.search.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),$options:'i'}}:{};const rows=staff?await source.filter(query,'full_name',50):await source.filter(query,{sort:nameField,limit:50,fields:[nameField]});return Response.json({options:(staff?rows:rows.items).map(r=>({id:r.id,name:r[nameField]||'Unnamed'})),has_more:staff?rows.length===50:rows.has_more,dataverse:false});}
  const chosen=input.selectedId?await source.get(input.selectedId).catch(e=>[403,404].includes(e.status)?null:Promise.reject(e)):null;
  if(input.selectedId&&!chosen)return Response.json({error:'Assignment not available.'},{status:400});
  const page=await db.ProjectDirectoryAssignment.filter({project_id:project.id,field:input.field},{limit:2});
  if(page.items.length>1)throw new Error('Duplicate directory assignments must be resolved before editing.');
  const values={project_id:project.id,field:input.field,selected_id:input.selectedId,selected_name:chosen?.[nameField]||'',selected_url:chosen?(entity==='Account'?`/accounts/${chosen.id}`:entity==='Contact'?`/people/${chosen.id}`:''):''};
  const assignment=page.items.length?await db.ProjectDirectoryAssignment.update(page.items[0].id,values):await db.ProjectDirectoryAssignment.create(values);
  return Response.json({assignment,notice:'Saved in the Hub directory. There is no corresponding Dataverse project column; signed appointments and contracts are unchanged.'});
 }catch(e){return Response.json({error:e.message||'Unable to update directory.'},{status:e.status===403?403:e.status===412?409:400});}
}