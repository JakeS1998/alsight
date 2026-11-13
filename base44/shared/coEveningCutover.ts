import {incident,lease,cas,now,audit,fail,safeError} from './coCore.ts';
import {cutoverDue,recoveryAuthorised} from './coCutoverTime.ts';
import {reconcile} from './coChanges.ts';
import {flowConfig,sharedFlowContext,flowRequest} from './dataverseFlowApi.ts';
import {graphClient} from './coMicrosoft.ts';
export async function eveningCutover(b,u,m,input={}){
 if(u.role!=='admin')fail('A Hub administrator is required for scheduled cutover.',403);
 if(input.ticket!==undefined&&(typeof input.ticket!=='string'||input.ticket.length>80))fail('Invalid cutover continuation.');
 let current=await incident(b);
 if(input.dry_run===true)return {dry_run:true,incident:current?{id:current.id,status:current.status,cutover_at:current.details?.cutover_at,authorised:recoveryAuthorised(current)}:null};
 if(!current||!cutoverDue(current)||!recoveryAuthorised(current))return {skipped:true,message:'No approved evening cutover is due.'};
 const token=crypto.randomUUID();
 current=await lease(b,async()=>{
  const i=await incident(b);if(!i||!cutoverDue(i)||!recoveryAuthorised(i))return null;
  if(input.ticket&&input.ticket!==i.details.cutover_ticket)return null;
  if(Date.parse(i.details.cutover_lease_until||'')>Date.now())return null;
  const saved=await cas(b.asServiceRole.entities.COIncident,i,{version:i.version},{status:'recovering',details:{...i.details,recovery_started_at:i.details.recovery_started_at||now(),cutover_state:'running',cutover_error:'',cutover_worker:token,cutover_lease_until:new Date(Date.now()+330000).toISOString(),cutover_ticket:null}});
  if(i.status==='active')await audit(b,u,'Evening cutover started; editing frozen',{cutover_at:i.details.cutover_at},i.id);
  return saved;
 });
 if(!current)return {skipped:true,message:'A cutover worker is already running or this continuation was superseded.'};
 let error='',results=[];
 try{
  await Promise.all([(async()=>{const ctx=await sharedFlowContext(b,await flowConfig(b),true);await flowRequest(ctx.environment,ctx.token,'WhoAmI');})(),(async()=>{const graph=await graphClient(b);await graph('/v1.0/sites/root?$select=id');})()]);
  const page=await b.asServiceRole.entities.COChange.filter({incident_id:current.id,status:{$in:['approved','ready','error','writing']}},{sort:'created_date',limit:3});
  const started=Date.now();
  for(const r of page.items){
   if(Date.now()-started>60000)break;
   const preview=await reconcile(b,u,m,{ids:[r.id]},false);const p=preview.results[0];
   if(p.status==='ready'){const written=await reconcile(b,u,m,{ids:[r.id]},true);results.push(...written.results);}else results.push(p);
  }
 }catch(e){error=safeError(e);}
 return lease(b,async()=>{
  const i=await incident(b);if(!i||i.id!==current.id||i.details.cutover_worker!==token)return {skipped:true};
  const E=b.asServiceRole.entities;
  const [remaining,replayable]=await Promise.all([E.COChange.count({incident_id:i.id,status:{$nin:['verified','excluded']}}),E.COChange.count({incident_id:i.id,status:{$in:['approved','ready','writing']}})]);
  const complete=!remaining&&!error,continuing=!error&&replayable>0;
  const details={...i.details,cutover_worker:null,cutover_lease_until:null,cutover_state:complete?'completed':continuing?'continuing':'blocked',cutover_error:error||(remaining&&!continuing?`${remaining} changes need independent approval, conflict resolution, retry or documented exclusion. Contingency access and the sync pause remain in place.`:''),cutover_remaining:remaining,cutover_ticket:continuing?crypto.randomUUID():null,...(complete?{closed_at:now(),closure_basis:'Two independent recovery approvals and verified evening write-back',cutover_completed_at:now()}:{})};
  const saved=await E.COIncident.update(i.id,{status:complete?'closed':'recovering',version:i.version+1,command_token:crypto.randomUUID(),details});
  await audit(b,u,complete?'Evening cutover completed; contingency access closed and Microsoft sync released':'Evening cutover batch recorded',{remaining,results,error:details.cutover_error},i.id);
  return {status:saved.status,remaining,results,message:complete?'All incident changes reconciled. Contingency user access is closed; normal Microsoft synchronisation can resume.':details.cutover_error||'The next approved write-back batch is queued.'};
 });
}