import {checkOutstandingPso} from './importProjectPso.ts';
const unlocked='1970-01-01T00:00:00.000Z';
export async function startPsoScheduledSync(db) {
 const {items}=await db.PsoSourceSyncState.filter({key:'primary'},{limit:1}),state=items[0];
 if(state?.status==='running' && Date.parse(state.updated_date)>Date.now()-6*3600000)return {skipped:'PSO check is already running.'};
 const payload={key:'primary',status:'running',cursor:'',dispatch_token:crypto.randomUUID(),lease_token:'',lease_until:unlocked,checked:0,failed:0,error:'',started_at:new Date().toISOString()};
 const saved=state?await db.PsoSourceSyncState.update(state.id,payload):await db.PsoSourceSyncState.create(payload);
 return {status:'queued',stateId:saved.id};
}
export async function continuePsoScheduledSync(db,reads,stateId,ticket) {
 const state=await db.PsoSourceSyncState.get(stateId);
 if(state.status!=='running' || state.dispatch_token!==ticket)return {skipped:'Batch ticket is no longer current.'};
 const token=crypto.randomUUID(),claimed=await db.PsoSourceSyncState.updateMany({id:stateId,status:'running',dispatch_token:ticket,lease_until:{$lt:new Date().toISOString()}},{$set:{lease_token:token,lease_until:new Date(Date.now()+360000).toISOString()}});
 if(!claimed.updated)return {skipped:'PSO batch is already running.'};
 try {
  const result=await checkOutstandingPso(db,reads,state.cursor);
  const current=await db.PsoSourceSyncState.get(stateId);
  if(current.lease_token!==token)throw new Error('PSO batch lease changed.');
  await db.PsoSourceSyncState.update(stateId,{status:result.hasMore?'running':'completed',cursor:result.cursor||'',dispatch_token:result.hasMore?crypto.randomUUID():'',lease_until:unlocked,lease_token:'',checked:(state.checked||0)+result.results.length,failed:(state.failed||0)+result.results.filter(row=>row.status==='error').length,...(!result.hasMore?{completed_at:new Date().toISOString()}:{})});
  return result;
 }catch(error){
  const current=await db.PsoSourceSyncState.get(stateId);
  if(current.lease_token===token)await db.PsoSourceSyncState.update(stateId,{status:'error',error:String(error.message).slice(0,1000),lease_until:unlocked,lease_token:''});
  throw error;
 }
}