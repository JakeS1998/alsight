import {dataverseRequest} from './dataverseRequest.ts';
import {flowSpecs} from './dataverseFlowFields.ts';
export async function commitProjectEnd(context,records,audit,comments){
 const boundary=`batch_${crypto.randomUUID()}`,change=`changeset_${crypto.randomUUID()}`;
 const marker=`[ALS Hub End Project ${audit.id}]`;
 const rootValues=records.find(r=>r.root)?.values;
 const commentText=[rootValues?.[comments.source]||'',`${marker} ${audit.ended_at} | ${audit.reason} | ${audit.ended_by}${audit.notes?` | ${audit.notes}`:''}`].filter(Boolean).join('\n');
 const operations=records.map((r,index)=>{
  const payload={statecode:r.inactive,...(Number.isInteger(r.status)?{statuscode:r.status}:{})};
  if(r.root){payload[comments.source]=commentText;const live=context.settings.mappings.find(m=>m.local==='live_project'&&m.write&&m.type==='Boolean');if(live)payload[live.source]=false;}
  return [`--${change}`,'Content-Type: application/http','Content-Transfer-Encoding: binary',`Content-ID: ${index+1}`,'',`PATCH ${context.environment}/api/data/v9.2/${r.entitySet}(${r.id}) HTTP/1.1`,'Content-Type: application/json',`If-Match: ${r.etag}`,'',JSON.stringify(payload)].join('\r\n');
 });
 const body=[`--${boundary}`,`Content-Type: multipart/mixed;boundary=${change}`,'',...operations,`--${change}--`,`--${boundary}--`,''].join('\r\n');
 const response=await dataverseRequest('End Project transaction',`${context.environment}/api/data/v9.2/$batch`,{method:'POST',redirect:'manual',signal:AbortSignal.timeout(90000),headers:{Authorization:`Bearer ${context.token}`,'Content-Type':`multipart/mixed;boundary=${boundary}`,Accept:'application/json','OData-Version':'4.0','OData-MaxVersion':'4.0'},body},[context.token]);
 const text=await response.text(),statuses=[...text.matchAll(/HTTP\/1\.[01] (\d{3})/g)].map(match=>Number(match[1]));
 if(!response.ok||statuses.length!==records.length||statuses.some(s=>s<200||s>=300))throw new Error('Dataverse did not confirm the complete End Project transaction. No partial changes are committed by a changeset. Reopen the confirmation to check the current status; check Dataverse permissions if it was refused.');
}
export async function mirrorProjectEnd(base44,context,config,records,audit){
 for(const [key,settings] of Object.entries(config.tables||{})){
  const spec=flowSpecs[key];
  if(!spec?.enums?.status?.includes('inactive')||key==='projects')continue;
  const ids=records.filter(r=>r.entity===settings.logicalName).map(r=>r.id);
  for(let i=0;i<ids.length;i+=100){let result;do{result=await base44.asServiceRole.entities[spec.entity].updateMany({dataverse_id:{$in:ids.slice(i,i+100)},status:{$ne:'inactive'}},{$set:{status:'inactive'}});}while(result.has_more);}
 }
 const updated=await base44.asServiceRole.entities.Project.update(context.record.id,{status:'inactive',live_project:false});
 await base44.asServiceRole.entities.ProjectClosure.update(audit.id,{status:'confirmed'});
 return updated;
}