import {aseAutomationScope,validASEId} from './aseAutomationScope.ts';
import {withASEAutomationLease} from './aseAutomationLease.ts';
import {advanceASEAutomation} from './aseAutomationStep.ts';
import {automaticEvidence} from './aseAutomaticEvidence.ts';
import {dispatchASEContinuation} from './aseAutomationDispatch.ts';
export async function manageASEAutomation(base44,user,input) {
  if(input.action==='automationRules') {
    const now=new Date('2026-10-05T12:00:00Z'),account={company_number:'12345678',local_authority_code:'E08000032'};
    const fact={component:'financial_strength',value:'25',reporting_period:'2026-03-31',source_date:'2026-06-01',confidence:'High',currency:'GBP'};
    const assess=(source,facts,raw)=>automaticEvidence(source,account,{facts,raw},now);
    const good=assess('accounts',[fact],{company_number:'12345678',periods:[{end:'2026-03-31',metrics:{net_assets:{value:25},assets:{value:100}}}]})[0];
    const checks={primaryMetric:good.automatic_eligible,wrongCompany:!assess('accounts',[fact],{company_number:'87654321'})[0].automatic_eligible,staleMetric:!assess('accounts',[{...fact,reporting_period:'2020-03-31'}],{company_number:'12345678'})[0].automatic_eligible,noAbsence:!assess('gazette',[{...fact,component:'adverse',value:'5'}],{})[0].automatic_eligible,externalScore:!assess('blackflag',[{...fact,component:'external_risk_score',value:'90'}],{})[0].automatic_eligible,ambiguousDebt:!assess('accounts',[{...fact,component:'debt'}],{company_number:'12345678',periods:[{end:fact.reporting_period,metrics:{borrowings:{concept:'Borrowings'}}}]})[0].automatic_eligible};
    return {checks,passed:Object.values(checks).every(Boolean)};
  }
  if(input.action==='automationScope') return aseAutomationScope(base44,input.accountId);
  if(input.action==='automationStart') {
    if(input.confirmed!==true) throw new Error('Confirm automatic source refresh and publication.');
    const result=await withASEAutomationLease(base44,async()=>{
      const active=await base44.entities.ASEAutomationRun.filter({status:{$in:['queued','running']}},{limit:1});
      if(active.items.length) throw new Error('An ASE run is already active. Pause it or wait for completion before starting another.');
      const scope=await aseAutomationScope(base44,input.accountId);
      return {run:await base44.entities.ASEAutomationRun.create({...scope,status:scope.eligible_count ? 'queued' : 'completed',requested_by:user.id,requested_by_name:user.full_name || user.id,processed_count:0,cursor:'',active_job_id:'',finished_listing:false,last_activity:new Date().toISOString()})};
    });
    if(result.busy) throw new Error('Another ASE operation is in progress; please wait.');return result;
  }
  if(input.runId!=null && !validASEId(input.runId)) throw new Error('Valid ASE run required.');
  if(input.action==='automationStatus') {
    let run;
    if(input.runId) run=await base44.entities.ASEAutomationRun.get(input.runId);
    else {const query=input.accountId ? {scope:'account',account_id:input.accountId} : {scope:'portfolio'};const page=await base44.entities.ASEAutomationRun.filter(query,{sort:'-created_date',limit:1});run=page.items[0];}
    if(!run) return {run:null};
    if(input.cursor!=null && (typeof input.cursor!=='string' || input.cursor.length>4096)) throw new Error('Invalid report cursor.');
    if(input.outcome && !['processing','rated','not_assessed','failed','skipped'].includes(input.outcome)) throw new Error('Invalid coverage filter.');
    const query={run_id:run.id,...(input.outcome ? {outcome:input.outcome} : {})};
    const [jobs,totals]=await Promise.all([base44.entities.ASEAutomationAccount.filter(query,{sort:'created_date',limit:20,...(input.cursor ? {cursor:input.cursor} : {})}),base44.entities.ASEAutomationAccount.aggregate({query:{run_id:run.id},groupBy:'outcome',sum:['missing_identifiers_count','failed_sources_count','blocked_sources_count','unknown_components_count'],limit:10})]);
    const current=run.active_job_id ? await base44.entities.ASEAutomationAccount.get(run.active_job_id) : null;
    return {run,jobs,totals:totals.rows,current};
  }
  if(!input.runId) throw new Error('Choose an ASE run.');
  if(input.action==='automationStep') return advanceASEAutomation(base44,input.runId,user);
  if(input.action==='automationDispatch') return dispatchASEContinuation(base44,input);
  const run=await base44.entities.ASEAutomationRun.get(input.runId);if(!run) throw new Error('ASE run unavailable.');
  if(input.action==='automationPause') {if(run.status==='completed') throw new Error('This run has completed.');return {run:await base44.entities.ASEAutomationRun.update(run.id,{status:'paused',pause_requested:true,dispatch_token:''})};}
  if(input.action==='automationResume' || input.action==='automationRetry') {
    if(input.action==='automationRetry') {
      if(!validASEId(input.jobId)) throw new Error('Valid failed Account required.');
      const job=await base44.entities.ASEAutomationAccount.get(input.jobId);
      if(!job || job.run_id!==run.id || job.outcome!=='failed') throw new Error('Choose a failed publication in this run.');
      if(run.active_job_id && run.active_job_id!==job.id) throw new Error('Pause and finish the current Account before retrying another.');
      await base44.entities.ASEAutomationAccount.update(job.id,{outcome:'processing',stage:'Retrying frozen publication',completed_at:''});
      await base44.entities.ASEAutomationRun.update(run.id,{active_job_id:job.id});
    } else if(run.status==='completed') throw new Error('This run has completed. Start a new refresh instead.');
    const active=await base44.entities.ASEAutomationRun.filter({status:{$in:['queued','running']}},{limit:10,fields:['id']});
    if(active.items.some(item=>item.id!==run.id)) throw new Error('Another ASE run is active. Pause it before resuming this run.');
    if(run.status==='running') await base44.entities.ASEAutomationRun.update(run.id,{status:'paused'});
    return {run:await base44.entities.ASEAutomationRun.update(run.id,{status:'queued',pause_requested:false,dispatch_token:'',error:'',waiting_until:'',completed_at:''})};
  }
  throw new Error('Invalid ASE automation operation.');
}