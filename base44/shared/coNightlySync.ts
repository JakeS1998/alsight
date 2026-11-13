import {lease,configuration,incident,now,audit,fail} from './coCore.ts';
export async function startNightlySync(b,u,input={}){
 if(u.role!=='admin')fail('A Hub administrator is required for nightly replication.',403);
 if(input.dry_run===true){const c=await configuration(b),i=await incident(b);return {dry_run:true,enabled:c.enabled,schedule:'02:00 Europe/London',paused:['active','recovering'].includes(i?.status)};}
 return lease(b,async c=>{
  const i=await incident(b);
  if(!input.configure_only&&i&&['active','recovering'].includes(i.status))return {skipped:true,message:'Nightly Microsoft backup is paused during contingency.'};
  if(!input.configure_only&&!c.enabled)return {skipped:true,message:'Nightly backup is disabled in standby policy.'};
  const at=now(),policy={...c.policy,rpo_minutes:1440,backup_cadence:'nightly',backup_time:'02:00',backup_timezone:'Europe/London',...(!input.configure_only?{nightly_sync_at:at}:{})};
  await b.asServiceRole.entities.COConfig.update(c.id,{policy});
  let result;do{result=await b.asServiceRole.entities.CODataset.updateMany({enabled:true,interval_minutes:{$ne:1440}},{$set:{interval_minutes:1440}});}while(result.has_more);
  await audit(b,u,input.configure_only?'Nightly incremental standby policy configured':'Nightly incremental standby sync started',{at,schedule:'02:00 Europe/London'});
  return {message:input.configure_only?'Nightly incremental backup configured for 02:00 UK time. Existing unfinished copies continue.':'Nightly sync queued; bounded background batches copy new and changed items.'};
 });
}