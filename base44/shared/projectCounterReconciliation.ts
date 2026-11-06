import {flowConfig,sharedFlowContext,flowRequest} from './dataverseFlowApi.ts';
import {withProjectNumberLease} from './projectNumberLease.ts';
const select='bss_projectnumbercounterid,bss_name,bss_lastnumberused';
const valid=value=>Number.isSafeInteger(value)&&value>=0&&value<=999999999;
export async function reconcileProjectCounter(base44,user,preview=false) {
 return withProjectNumberLease(base44,(counter,assertLease)=>reconcileLeasedProjectCounter(base44,user,counter,assertLease,preview));
}
export async function reconcileLeasedProjectCounter(base44,user,counter,assertLease,preview=false) {
  // Reuse the caller's numbering lock for immediate writes; never acquire it twice.
  // Other shared Dataverse data flows remain read-only.
  const {environment,token}=await sharedFlowContext(base44,await flowConfig(base44));
  const page=await flowRequest(environment,token,`bss_projectnumbercounters?$select=${select}&$top=2`);
  if(page['@odata.nextLink']||page.value?.length!==1)throw new Error('Exactly one Dataverse project-number counter is required. No counters were changed.');
  const remote=page.value[0],id=remote.bss_projectnumbercounterid;
  if(!/^[a-f0-9-]{36}$/i.test(id)||!valid(remote.bss_lastnumberused)||!valid(counter.last_used))throw new Error('A project counter is invalid. No counters were changed.');
  if(counter.dataverse_counter_id&&(counter.dataverse_counter_id!==id||counter.dataverse_counter_environment!==environment))throw new Error('The Dataverse counter identity changed. Review the synchronisation configuration before continuing.');
  const local=counter.last_used,external=remote.bss_lastnumberused,baseline=counter.dataverse_synced_number;
  const known=valid(baseline),localChanged=known&&local!==baseline,remoteChanged=known&&external!==baseline;
  const conflict=local!==external&&(!known||(localChanged&&remoteChanged));
  const target=local===external?local:known&&localChanged&&!remoteChanged?local:known&&remoteChanged&&!localChanged?external:Math.max(local,external);
  const result={localBefore:local,dataverseBefore:external,lastUsed:target,conflict,policy:conflict?'Both counters differ; preserve the higher number.':'Propagate the side changed since the last successful sync.'};
  if(preview)return {...result,preview:true};
  await assertLease();
  if(external!==target){
   if(!/^W\/"[0-9]+"$/.test(remote['@odata.etag']))throw new Error('Dataverse did not supply a safe counter version.');
   await flowRequest(environment,token,`bss_projectnumbercounters(${id})`,{method:'PATCH',headers:{'If-Match':remote['@odata.etag']},body:JSON.stringify({bss_lastnumberused:target})});
  }
  const confirmed=await flowRequest(environment,token,`bss_projectnumbercounters(${id})?$select=${select}`);
  if(confirmed.bss_lastnumberused!==target)throw new Error('The Dataverse counter changed during synchronisation. The next check will reconcile it.');
  const fresh=await assertLease();
  if(fresh.last_used!==local)throw new Error('The ALS Hub counter changed during synchronisation. Retry the check.');
  const now=new Date().toISOString(),db=base44.asServiceRole.entities;
  if(local!==target)await db.ProjectNumberChange.create({previous_number:local,last_used:target,reason:`Dataverse counter reconciliation. ${result.policy}`,changed_by_id:user.id,changed_by_name:'Dataverse counter sync',changed_at:now});
  const saved=await db.ProjectNumberCounter.updateMany({id:counter.id,last_used:local,lease_token:fresh.lease_token,lease_until:{$gt:now}},{$set:{last_used:target,dataverse_synced_number:target,dataverse_counter_id:id,dataverse_counter_environment:environment,dataverse_checked_at:now,...(local!==target?{changed_by:'dataverse_counter_sync',changed_at:now}:{})}});
  if(!saved.updated)throw new Error('The project counter lock changed. Retry the check.');
  return {...result,ok:true,checkedAt:now};
}