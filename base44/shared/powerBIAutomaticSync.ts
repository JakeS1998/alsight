import {powerBIOrderState} from './powerBIOrderState.ts';
import {startPowerBIOrders,batchPowerBIOrders,confirmPowerBIOrders} from './powerBIOrderImport.ts';
const sameSources=state=>JSON.stringify(state.sources)===JSON.stringify(state.active_sources);
const automatic=state=>state.tables?.automatic?.revision===state.revision;
const progress=(state,attempt=0,busy=false)=>({status:state.status==='running'?(attempt>=60?'deferred':'running'):state.status,generation:state.generation,attempt,busy,processed:(state.tables?.list||[]).map(t=>({type:t.type,processed:t.processed,expected:t.expected}))});
async function publish(base44,user,state){
 if(!automatic(state)||!sameSources(state))throw new Error('Automatic publishing requires the previously confirmed field mappings.');
 await confirmPowerBIOrders(base44,user,{generation:state.generation,revision:state.revision,netGBPConfirmed:true});
 return {status:'completed',generation:state.generation,published:true};
}
export async function syncPowerBIOrders(base44,user,input){
 let state=await powerBIOrderState(base44);
 if(!state?.active_generation)return {status:'skipped',reason:'Complete the initial Power BI import and confirmation first.'};
 if(!sameSources(state)||state.status==='configured')return {status:'skipped',reason:'Changed mappings need manual review and confirmation.'};
 if(input.begin===true){
  if(state.status==='running')return automatic(state)?progress(state):{status:'skipped',reason:'A manual import is in progress.'};
  if(state.status==='completed'&&state.generation!==state.active_generation)return automatic(state)?publish(base44,user,state):{status:'skipped',reason:'A manual import is awaiting confirmation.'};
  if(state.status==='error'&&!automatic(state))return {status:'skipped',reason:'Review the failed manual import before automatic syncing.'};
  const now=new Date().toISOString(),leaseToken=crypto.randomUUID();
  const lock=await base44.entities.PowerBIOrderImport.updateMany({id:state.id,status:state.status,generation:state.generation,revision:state.revision,updated_date:state.updated_date,lease_until:{$lt:now}},{$set:{lease_token:leaseToken,lease_until:new Date(Date.now()+240000).toISOString()}});
  if(!lock.updated)return {status:'skipped',reason:'Another sync is starting.'};
  try{state=(await startPowerBIOrders(base44,{automatic:true,approvedRevision:state.revision,leaseToken})).state;}
  catch(error){await base44.entities.PowerBIOrderImport.updateMany({id:state.id,lease_token:leaseToken},{$set:{lease_token:'',lease_until:'1970-01-01T00:00:00.000Z'}});throw error;}
  return progress(state);
 }
 if(typeof input.generation!=='string'||input.generation!==state.generation)return {status:'skipped',reason:'This sync has been superseded.'};
 if(!automatic(state))return {status:'skipped',reason:'This is not an automatic import.'};
 if(!Number.isInteger(input.attempt)||input.attempt<0||input.attempt>=60)throw new Error('Invalid automatic sync continuation.');
 if(state.status==='completed')return state.active_generation===state.generation?{status:'completed',published:true}:publish(base44,user,state);
 if(state.status!=='running')throw new Error(state.error||'Automatic import is not running. The last confirmed snapshot remains active.');
 const result=await batchPowerBIOrders(base44,{generation:state.generation});
 state=result.state;
 return state.status==='completed'?publish(base44,user,state):progress(state,input.attempt+1,Boolean(result.busy));
}