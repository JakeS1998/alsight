import {get,fail,audit} from './coCore.ts';
import {microsoftSyncPause} from './coMicrosoftPause.ts';
export async function resumeContingencySyncs(b,u,input){
 if(u.role!=='admin')fail('An administrator is required to resume Microsoft sync.',403);
 const i=await get(b.asServiceRole.entities.COIncident,input.incident_id);
 if(i.status!=='closed'||!i.details?.cutover_completed_at)return {skipped:true};
 const paused=await microsoftSyncPause(b);if(paused)return paused;
 if(input.dry_run===true)return {dry_run:true,can_resume:true};
 const E=b.asServiceRole.entities;
 const pages=await Promise.all([E.FinanceDataverseSync.filter({key:'primary',status:'running'},{limit:2}),E.PsoSourceSyncState.filter({key:'primary',status:'running'},{limit:2})]);
 if(pages.some(p=>p.items.length>1))fail('Duplicate sync states require administrator review.',409);
 const now=new Date().toISOString(),resumed=[];
 for(let index=0;index<pages.length;index++){const row=pages[index].items[0];if(!row)continue;if(row.lease_until>now)fail('A previous sync lease has not expired. Retry after it completes.',409);const entity=index===0?E.FinanceDataverseSync:E.PsoSourceSyncState;await entity.update(row.id,{dispatch_token:`${index===0?'resume:':''}${crypto.randomUUID()}`});resumed.push(index===0?'Dataverse finance':'SharePoint PSO');}
 await audit(b,u,'Paused Microsoft continuation batches resumed',{resumed,regular_sync:'Existing Dataverse and Power BI schedules resume on their normal cadence.'},i.id);
 return {resumed};
}