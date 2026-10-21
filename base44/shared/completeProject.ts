import {flowRequest} from './dataverseFlowApi.ts';
import {projectCompletion} from './projectCompletion.ts';
export async function completeProject(base44,user,context,input){
 if(input.confirm!==true){const error=new Error('Confirm project completion and deactivation.');error.status=400;throw error;}
 const state=await projectCompletion(base44,context.record);
 if(!state.ready){const error=new Error(`Complete pathway section 10 first: ${state.missing.join(', ')}.`);error.status=409;throw error;}
 const {settings,environment,token,sourceId}=context;
 const comments=settings.mappings.find(m=>m.local==='comments'&&m.write&&['String','Memo'].includes(m.type));
 if(!comments)throw new Error('Enable the project Comments mapping for write-back so the completion record is retained in Dataverse.');
 const live=settings.mappings.find(m=>m.local==='live_project'&&m.write&&m.type==='Boolean');
 const fields=['statecode',comments.source,...(live?[live.source]:[])];
 const [root,metadata,capacity]=await Promise.all([
  flowRequest(environment,token,`${settings.entitySet}(${sourceId})?$select=${fields.join(',')}`),
  flowRequest(environment,token,`EntityDefinitions(LogicalName='${settings.logicalName}')/Attributes/Microsoft.Dynamics.CRM.StateAttributeMetadata?$select=LogicalName&$expand=OptionSet($select=Options)`),
  flowRequest(environment,token,`EntityDefinitions(LogicalName='${settings.logicalName}')/Attributes(LogicalName='${comments.source}')/Microsoft.Dynamics.CRM.${comments.type==='Memo'?'Memo':'String'}AttributeMetadata?$select=MaxLength`)
 ]);
 const inactive=metadata.value?.find(a=>a.LogicalName==='statecode')?.OptionSet?.Options?.find(o=>String(o.InvariantName).toLowerCase()==='inactive');
 if(!inactive)throw new Error('Dataverse does not support deactivation for this project table.');
 const marker='[ALS Hub Project Complete]',recovered=root.statecode===inactive.Value&&String(root[comments.source]||'').includes(marker);
 if(root.statecode===inactive.Value&&!recovered)throw new Error('This project is already inactive and was not marked complete through this action.');
 const text=recovered?root[comments.source]:[root[comments.source]||'',`${marker} ${new Date().toISOString()} | ${user.id} | Pathway section 10 complete`].filter(Boolean).join('\n');
 if(!Number.isInteger(capacity.MaxLength)||text.length>capacity.MaxLength)throw new Error('The completion record exceeds the Dataverse Comments capacity. No changes made.');
 if(!recovered){
  if(!/^W\/"[0-9]+"$/.test(root['@odata.etag']||''))throw new Error('Reload this project before completing it.');
  await flowRequest(environment,token,`${settings.entitySet}(${sourceId})`,{method:'PATCH',headers:{'If-Match':root['@odata.etag']},body:JSON.stringify({statecode:inactive.Value,...(Number.isInteger(inactive.DefaultStatus)?{statuscode:inactive.DefaultStatus}:{}),[comments.source]:text,...(live?{[live.source]:false}:{})})});
 }
 const project=await base44.asServiceRole.entities.Project.update(context.record.id,{status:'inactive',live_project:false,comments:text});
 return {completed:true,project};
}