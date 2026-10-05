import {supportedASEQuery} from './aseAutomationScope.ts';
import {accountModel} from './asePolicy.ts';
import {withASEAutomationLease} from './aseAutomationLease.ts';
import {advanceASEAccount} from './aseAutomationAccountStep.ts';
export async function advanceASEAutomation(base44,runId,user) {
  return withASEAutomationLease(base44,async assertLease=>{
    const db=base44.entities,run=await db.ASEAutomationRun.get(runId);
    if(!run || !['queued','running'].includes(run.status)) return {continue:false,waitFor:'PT15S'};
    try {
      await db.ASEAutomationRun.updateMany({id:run.id,status:{$in:['queued','running']}},{$set:{status:'running',last_activity:new Date().toISOString(),waiting_until:'',error:''}});
      let job=run.active_job_id ? await db.ASEAutomationAccount.get(run.active_job_id) : null;
      if(!job) {
        let account,page;
        if(run.scope==='account') {account=run.finished_listing ? null : await db.Account.get(run.account_id);page={has_more:false,next_cursor:null};}
        else {page=await db.Account.filter(supportedASEQuery,{sort:'id',limit:1,...(run.cursor ? {cursor:run.cursor} : {})});account=page.items[0];}
        if(!account) {await db.ASEAutomationRun.update(run.id,{status:'completed',completed_at:new Date().toISOString(),active_job_id:'',finished_listing:true});return {continue:false,waitFor:'PT15S'};}
        const jobKey=`${run.id}:${account.id}`,existing=await db.ASEAutomationAccount.filter({job_key:jobKey},{limit:1});
        job=existing.items[0] || await db.ASEAutomationAccount.create({job_key:jobKey,run_id:run.id,account_id:account.id,account_name:account.name,model:accountModel(account),outcome:'processing',source_index:0,sources:[],blockers:[],stage:'Queued'});
        await db.ASEAutomationRun.update(run.id,{active_job_id:job.id,cursor:page.next_cursor || '',finished_listing:!page.has_more});
        run.active_job_id=job.id;run.finished_listing=!page.has_more;
      }
      const progress=job.outcome==='processing' ? await advanceASEAccount(base44,run,job,user,assertLease) : {done:true};
      await assertLease();
      if(progress.done) {
        const processed=await db.ASEAutomationAccount.count({run_id:run.id,outcome:{$ne:'processing'}});
        await db.ASEAutomationRun.updateMany({id:run.id,status:{$in:['queued','running']}},{$set:{active_job_id:'',processed_count:processed,last_activity:new Date().toISOString(),...(run.finished_listing ? {status:'completed',completed_at:new Date().toISOString()} : {})}});
      } else if(progress.waitingUntil) await db.ASEAutomationRun.update(run.id,{waiting_until:progress.waitingUntil});
      const current=await db.ASEAutomationRun.get(run.id);
      return {continue:['queued','running'].includes(current.status),waitFor:progress.waitFor || 'PT15S'};
    } catch(error) {await db.ASEAutomationRun.update(run.id,{status:'paused',error:String(error.message).slice(0,1000),last_activity:new Date().toISOString()});return {continue:false,waitFor:'PT15S',error:String(error.message)};}
  });
}