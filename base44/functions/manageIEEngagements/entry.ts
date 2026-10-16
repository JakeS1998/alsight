import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';
import {ieRoles,ieScope,ieRecord,ieEditable,ieError,ieText} from '../../shared/ieAccess.ts';
import {ieLookup,ieLinkedProject} from '../../shared/ieLookups.ts';
import {ieSummary,ieOptions,ieQuery} from '../../shared/ieReads.ts';
import {ieValues} from '../../shared/ieValues.ts';
export default async function(req){
 try{
  const base44=createClientFromRequest(req),user=await base44.auth.me();
  if(!user||!await base44.auth.isAuthenticated())return Response.json({error:'Sign in to access I&E.'},{status:401});
  if(!ieRoles.includes(user.role))return Response.json({error:'I&E access is not available for this role.'},{status:403});
  const input=await req.json();if(!input||typeof input!=='object'||Array.isArray(input))ieError('Invalid request.');
  const db=base44.asServiceRole.entities,action=input.action;
  if(action==='summary')return Response.json(await ieSummary(base44,user));
  if(action==='options')return Response.json(await ieOptions(base44,user));
  if(action==='lookup'){if(!ieEditable(user))ieError('Engagement creation access required.',403);return Response.json(await ieLookup(base44,user,input));}
  if(action==='classifications')return Response.json(await db.IEClassification.filter({},{sort:'name',limit:500}));
  if(action==='classificationSave'){
   if(!['admin','sam_director'].includes(user.role))ieError('A SAM Director or administrator must maintain service types.',403);
   const name=ieText(input.name,150);if(!name||!['category','support'].includes(input.kind))ieError('Enter a classification name and type.');
   const parent_id=ieText(input.parent_id,100);
   if(parent_id){const parent=await db.IEClassification.get(parent_id);if(parent.kind!=='category')ieError('Choose a category.');}
   const values={name,kind:input.kind,parent_id:input.kind==='support'?parent_id:'',active:input.active!==false};
   if(input.id){const previous=await db.IEClassification.get(ieText(input.id,100));if(previous.kind!==input.kind||(previous.parent_id||'')!==values.parent_id)ieError('Keep the existing classification hierarchy; retire it and add another if needed.');return Response.json(await db.IEClassification.update(previous.id,values));}
   return Response.json(await db.IEClassification.create({...values,provisional:true}));
  }
  if(action==='list'){
   const query=ieQuery(user,input.filters),limit=input.page_size==null?30:Number(input.page_size);
   if(!Number.isInteger(limit)||limit<1||limit>30)ieError('Choose a page size between 1 and 30.');
   const [page,total]=await Promise.all([db.IEEngagement.filter(query,{sort:'-updated_date',limit,...(input.cursor?{cursor:ieText(input.cursor,4000)}:{})}),db.IEEngagement.count(query)]);
   return Response.json({...page,total});
  }
  if(action==='detail'){
   const item=await ieRecord(base44,user,input.id);
   const events=await db.IEEvent.filter({engagement_id:item.id},{sort:'-occurred_at',limit:10});
   const [project,opportunity,account]=await Promise.all([item.project_id?base44.entities.Project.get(item.project_id).catch(()=>null):null,item.opportunity_id?base44.entities.Opportunity.get(item.opportunity_id).catch(()=>null):null,base44.entities.Account.get(item.client_id).catch(()=>null)]);
   return Response.json({item,events:events.items,canEdit:ieEditable(user,item),links:{client:!!account,project:!!project||user.role==='sam_director',opportunity:!!opportunity}});
  }
  if(action==='linkedProject')return Response.json(await ieLinkedProject(base44,user,input));
  if(action==='projects'){
   if(!['admin','sam_director'].includes(user.role))ieError('SAM Director project access required.',403);
   const linked=await db.IEEngagement.filter({project_id:{$ne:''}},{distinct:'project_id',limit:1000});if(linked.has_more)ieError('The SAM project register needs another reporting page.');
   const query={$and:[{$or:[{id:{$in:linked.items}},{strategic_account_manager_aad_id:{$exists:true,$nin:[null,'']}}]},{name:{$regex:ieText(input.search,100).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),$options:'i'}}]};
   return Response.json(await db.Project.filter(query,{sort:'name',limit:30,fields:['name','project_number','client_name','site_postcode','live_project'],...(input.cursor?{cursor:ieText(input.cursor,4000)}:{})}));
  }
  if(action==='save'){
   const previous=input.id?await ieRecord(base44,user,input.id):null;
   if(!ieEditable(user,previous))ieError('You cannot change this engagement.',403);
   const values=await ieValues(base44,user,input,previous),now=new Date().toISOString();
   let item;
   if(previous){
    if(input.revision!==previous.revision)ieError('This engagement changed. Close the form, refresh and reopen it before saving.',409);
    const result=await db.IEEngagement.updateMany({id:previous.id,revision:previous.revision},{$set:values,$inc:{revision:1}});
    if(!result.updated)ieError('Another update was saved first. Refresh before retrying.',409);
    item=await db.IEEngagement.get(previous.id);
   }else item=await db.IEEngagement.create({...values,reference:`IE-${now.slice(0,4)}-${crypto.randomUUID().replaceAll('-','').toUpperCase()}`,revision:1,origin:'alsight'});
   const changes=Object.fromEntries(Object.keys(values).filter(key=>!previous||JSON.stringify(previous[key])!==JSON.stringify(values[key])).map(key=>[key,{before:previous?.[key]??null,after:values[key]}]));
   const kind=!previous?'created':previous.status!==item.status?'status_changed':previous.owner_id!==item.owner_id?'assigned':'updated';
   await db.IEEvent.create({engagement_id:item.id,engagement_name:item.name,actor_id:user.id,actor_name:user.full_name||user.email,kind,summary:!previous?'Engagement created':kind==='status_changed'?`Status changed to ${item.status.replaceAll('_',' ')}`:kind==='assigned'?'Engagement reassigned':'Engagement updated',occurred_at:now,changes:{...changes,...(input.reason?{reason:ieText(input.reason,1000)}:{})}});
   return Response.json({item});
  }
  ieError('Unknown I&E operation.');
 }catch(error){const status=Number(error.status||error.response?.status||500);return Response.json({error:error.message||'I&E is temporarily unavailable.'},{status:[400,401,403,404,409,429].includes(status)?status:500});}
}