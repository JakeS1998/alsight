import {ieRecord,ieEditable,ieError,ieText} from './ieAccess.ts';
import {workKinds,ieWorkValues,ieFinanceValues,ieWorkspaceEvent} from './ieWorkspaceValues.ts';
import {ieServiceValue} from './ieServiceValue.ts';
export const ieWorkspaceOperations=['workList','workSave','workDelete','documents','documentSave','documentDelete','finance','financeSave'];
export async function ieWorkspaceAction(base44,user,input){
 const item=await ieRecord(base44,user,input.engagement_id),db=base44.asServiceRole.entities,action=input.action;
 const options={limit:30,sort:'-created_date',...(input.cursor?{cursor:ieText(input.cursor,4000)}:{})};
 if(action==='workList'){
  const kind=ieText(input.kind,30),status=ieText(input.status,30);if(kind!=='all'&&!workKinds.includes(kind))ieError('Choose a work area.');
  if(status&&!['planned','in_progress','complete'].includes(status))ieError('Choose a task status.');
  const query={engagement_id:item.id,...(kind==='all'?{}:{kind}),...(status?{status}:{})};
  const [page,summary]=await Promise.all([db.IEWorkItem.filter(query,options),db.IEWorkItem.aggregate({query,groupBy:'status',sum:['attendees','stakeholders','survey_responses']})]);
  return {...page,summary:summary.rows};
 }
 if(action==='documents')return db.IEDocument.filter({engagement_id:item.id},options);
 if(action==='finance'){const page=await db.IEFinance.filter({engagement_id:item.id},{limit:1});return {item:page.items[0]||null};}
 if(!ieEditable(user,item))ieError('You cannot change this engagement.',403);
 if(action==='workSave'){
  const values=ieWorkValues(input.values||{},item);let previous=null;
  if(input.id){previous=await db.IEWorkItem.get(ieText(input.id,100));if(previous.engagement_id!==item.id)ieError('Work item unavailable.',403);if(previous.kind!==values.kind)ieError('Keep work in its original area.');}
  const saved=previous?await db.IEWorkItem.update(previous.id,values):await db.IEWorkItem.create({...values,engagement_id:item.id});
  await ieWorkspaceEvent(db,user,item,`${previous?'Updated':'Added'} ${values.kind}: ${values.title}`);return {item:saved};
 }
 if(action==='workDelete'||action==='documentDelete'){
  const entity=action==='workDelete'?db.IEWorkItem:db.IEDocument,previous=await entity.get(ieText(input.id,100));
  if(previous.engagement_id!==item.id)ieError('Record unavailable.',403);
  await entity.delete(previous.id);await ieWorkspaceEvent(db,user,item,`Removed ${action==='workDelete'?'work item':'document reference'}: ${previous.title}`);return {ok:true};
 }
 if(action==='documentSave'){
  const values=input.values||{},title=ieText(values.title,200),category=ieText(values.category,30),sharepoint_url=ieText(values.sharepoint_url,4000);
  if(!title||!['research','consultation','creative','finance','other'].includes(category))ieError('Enter a document title and category.');
  if(!URL.canParse(sharepoint_url))ieError('Enter a valid HTTPS SharePoint link.');
  const url=new URL(sharepoint_url);
  if(url.protocol!=='https:'||!url.hostname.endsWith('.sharepoint.com')||url.username||url.password||url.port)ieError('Enter a valid HTTPS SharePoint link.');
  const saved=await db.IEDocument.create({engagement_id:item.id,title,category,sharepoint_url,uploaded_by:user.id,uploaded_by_name:user.full_name||user.email});
  await ieWorkspaceEvent(db,user,item,`Added document: ${title}`);return {item:saved};
 }
 if(action==='financeSave'){
  const values=ieFinanceValues(input.values||{});
  await db.IEFinance.upsert([{...values,engagement_id:item.id,saved_by_name:user.full_name||user.email}],{key:'engagement_id'});
  await db.IEEngagement.update(item.id,ieServiceValue(item,values));
  await ieWorkspaceEvent(db,user,item,'Updated engagement finance totals and notes.');return {ok:true};
 }
 ieError('Unknown workspace operation.');
}