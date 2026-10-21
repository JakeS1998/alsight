import {createClientFromRequest} from 'npm:@base44/sdk@0.8.54';
import {flowConfig,flowRequest} from '../../shared/dataverseFlowApi.ts';
import {writeFlowContext} from '../../shared/dataverseFlowWrite.ts';
import {endingReasons,projectEndPlan} from '../../shared/projectEndPlan.ts';
import {commitProjectEnd,mirrorProjectEnd} from '../../shared/projectEndTransaction.ts';
import {commercialConversions} from '../../shared/commercialConversions.ts';
export default async function(req){
 try{
  const base44=createClientFromRequest(req),user=await base44.auth.me();
  if(!user)return Response.json({error:'Sign in first.'},{status:401});
  if(req.method!=='POST')return Response.json({error:'POST required.'},{status:405});
  const raw=await req.text();
  if(raw.length>8000)return Response.json({error:'Request too large.'},{status:400});
  const input=JSON.parse(raw);
  if(input.action==='metrics')return Response.json(await commercialConversions(base44,user));
  if(!['preview','end'].includes(input.action))return Response.json({error:'Invalid project lifecycle action.'},{status:400});
  if(!['admin','director','bdm'].includes(user.role))return Response.json({error:'Only project editors can end projects.'},{status:403});
  const config=await flowConfig(base44);
  const context=await writeFlowContext(base44,user,config,{table:'projects',recordId:input.projectId,action:'lifecycle'});
  const db=base44.asServiceRole.entities;
  const confirmed=(await db.ProjectClosure.filter({project_id:context.record.id,status:'confirmed'},{limit:1})).items[0];
  if(confirmed)return Response.json({ended:true,reason:confirmed.reason,endedAt:confirmed.ended_at,project:{...context.record,status:'inactive',live_project:false}});
  const comments=context.settings.mappings.find(m=>m.local==='comments'&&m.write&&['String','Memo'].includes(m.type));
  if(!comments)throw new Error('Enable the project Comments mapping for write-back first so Dataverse retains the ending reason and audit reference.');
  const plan=await projectEndPlan(context),root=plan.records.find(r=>r.root);
  if(input.action==='preview')return Response.json({hash:plan.hash,count:plan.records.length,tables:plan.tableCounts,alreadyInactive:root.currentState===root.inactive});
  if(input.confirm!==true||!endingReasons.includes(input.reason)||typeof input.notes!=='string'||input.notes.length>2000||(input.reason==='Other'&&!input.notes.trim()))return Response.json({error:'Choose an ending reason; add details for Other and explicitly confirm.'},{status:400});
  const previous=(await db.ProjectClosure.filter({project_id:context.record.id,status:'pending',reason:input.reason,notes:input.notes.trim()},{sort:'-created_date',limit:1})).items[0];
  const recovered=previous&&root.currentState===root.inactive&&String(root.values[comments.source]||'').includes(`[ALS Hub End Project ${previous.id}]`);
  if(!recovered){
   if(input.hash!==plan.hash)return Response.json({error:'Project or linked records changed. Close and reopen the confirmation to review the current records.'},{status:409});
   if(root.currentState===root.inactive)throw new Error('This project is already inactive in Dataverse and has no confirmed ending reason in ALS Hub. No changes made.');
  }
  const audit=previous||await db.ProjectClosure.create({project_id:context.record.id,dataverse_id:context.sourceId,reason:input.reason,notes:input.notes.trim(),ended_at:new Date().toISOString(),ended_by:user.id,status:'pending',record_count:plan.records.length,table_counts:plan.tableCounts});
  if(!recovered){
   const attribute=await flowRequest(context.environment,context.token,`EntityDefinitions(LogicalName='${context.settings.logicalName}')/Attributes(LogicalName='${comments.source}')/Microsoft.Dynamics.CRM.${comments.type==='Memo'?'Memo':'String'}AttributeMetadata?$select=MaxLength`);
   const text=[root.values[comments.source]||'',`[ALS Hub End Project ${audit.id}] ${audit.ended_at} | ${audit.reason} | ${audit.ended_by}${audit.notes?` | ${audit.notes}`:''}`].filter(Boolean).join('\n');
   if(!Number.isInteger(attribute.MaxLength)||text.length>attribute.MaxLength)throw new Error('The ending audit exceeds the Dataverse Comments field capacity. Shorten the details or ask an administrator to increase that field. No records changed.');
   await commitProjectEnd(context,plan.records,audit,comments);
  }
  const project=await mirrorProjectEnd(base44,context,config,plan.records,audit);
  return Response.json({ended:true,reason:audit.reason,endedAt:audit.ended_at,project});
 }catch(error){return Response.json({error:error.message},{status:error.status||500});}
}