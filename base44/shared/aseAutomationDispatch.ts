export async function aseContinuationTicket(base44,runId,waitFor='PT15S',busy=false) {
  const run=await base44.entities.ASEAutomationRun.get(runId);
  if(!run || run.pause_requested || !['queued','running'].includes(run.status) || (busy && run.status==='running')) return {continue:false,waitFor};
  const token=crypto.randomUUID();
  await base44.entities.ASEAutomationRun.update(run.id,{dispatch_token:token,...(busy ? {status:'running'} : {})});
  return {continue:true,waitFor,dispatchToken:token};
}
export async function dispatchASEContinuation(base44,input) {
  if(typeof input.dispatchToken!=='string' || !/^[a-f0-9-]{36}$/.test(input.dispatchToken)) throw new Error('Valid continuation ticket required.');
  const run=await base44.entities.ASEAutomationRun.get(input.runId);
  if(!run || run.pause_requested || run.status!=='running' || run.dispatch_token!==input.dispatchToken) return {queued:false};
  await base44.entities.ASEAutomationRun.update(run.id,{status:'queued',dispatch_token:''});
  return {queued:true};
}