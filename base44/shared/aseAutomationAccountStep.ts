import {accountModel,getPolicy} from './asePolicy.ts';
import {sourceIdentifier} from './aseSourceCommon.ts';
import {collectASESource} from './aseCollectSource.ts';
import {publishAutomatically} from './aseAutomaticPublication.ts';
import {gazetteWaitSeconds} from './aseProviderPolicy.ts';
const companySources=['registry','accounts','gazette'],councilSources=['local_authority','council_governance'];
export async function advanceASEAccount(base44,run,job,user,assertLease) {
  const account=await base44.entities.Account.get(job.account_id),model=account && accountModel(account);
  if(!account || account.status==='inactive' || account.name.startsWith('ASE Demo') || !model || model!==job.model) {await base44.entities.ASEAutomationAccount.update(job.id,{outcome:'skipped',stage:'Skipped',blockers:['Account became unavailable, inactive, a demo or changed organisation model.'],completed_at:new Date().toISOString()});return {done:true};}
  const keys=model==='company' ? companySources : councilSources,key=keys.find(candidate=>!(job.sources || []).some(source=>source.key===candidate));
  if(key) {
    let outcome;
    try {
      const identifier=sourceIdentifier(account,key==='registry' ? 'accounts' : key);
      {
        const seconds=key==='gazette' ? gazetteWaitSeconds() : 0;
        if(seconds) {await base44.entities.ASEAutomationAccount.update(job.id,{stage:'Waiting for Gazette overnight window'});return {done:false,waitFor:`PT${seconds}S`,waitingUntil:new Date(Date.now()+seconds*1000).toISOString()};}
        await base44.entities.ASEAutomationAccount.update(job.id,{stage:`Collecting ${key}`});
        const result=await collectASESource(base44,account,key,user);await assertLease();
        outcome={key,identifier,status:result.audit.status,audit_id:result.audit.id,evidence_count:result.evidenceCount,eligible_count:result.eligibleCount,warnings:(result.audit.warnings || []).slice(0,6).map(text=>String(text).slice(0,600))};
      }
    } catch(error) {
      if(error.status===429 && (job.retry_count || 0)<3) {await base44.entities.ASEAutomationAccount.update(job.id,{retry_count:(job.retry_count || 0)+1,stage:`Backing off ${key}: ${String(error.message).slice(0,200)}`});return {done:false,waitFor:`PT${Math.max(60,error.retryAfter || 300)}S`};}
      let missing=false;try{sourceIdentifier(account,key==='registry' ? 'accounts' : key);}catch{missing=true;}
      outcome={key,status:missing ? 'missing_identifier' : 'failed',error:String(error.message || 'Source failed.').slice(0,1000)};
    }
    const sources=[...(job.sources || []).filter(source=>keys.includes(source.key)),outcome];
    await base44.entities.ASEAutomationAccount.update(job.id,{sources,source_index:(job.source_index || 0)+1,retry_count:0,stage:`${key}: ${outcome.status}`,missing_identifiers_count:sources.filter(s=>s.status==='missing_identifier').length,failed_sources_count:sources.filter(s=>s.status==='failed').length,blocked_sources_count:sources.filter(s=>s.status==='blocked').length});
    return {done:false,waitFor:'PT15S'};
  }
  await assertLease();
  try {
    const policy=await getPolicy(base44),assessment=await publishAutomatically(base44,account,policy,{id:run.requested_by,full_name:run.requested_by_name},job);
    const components=await base44.entities.ASEComponentScore.filter({assessment_id:assessment.id,score:null},{limit:10,fields:['component_label']});
    const blockers=[...(job.sources || []).filter(s=>keys.includes(s.key) && ['missing_identifier','failed','blocked'].includes(s.status)).map(s=>`${s.key}: ${s.error}`),...components.items.map(c=>`${c.component_label}: no sufficiently validated current evidence.`)].slice(0,25);
    await base44.entities.ASEAutomationAccount.update(job.id,{outcome:assessment.displayed_rating==null ? 'not_assessed' : 'rated',assessment_id:assessment.id,rating:assessment.displayed_rating ?? null,coverage:assessment.coverage,unknown_components_count:components.items.length,blockers,stage:'Automatically published',completed_at:new Date().toISOString()});
  } catch(error) {await base44.entities.ASEAutomationAccount.update(job.id,{outcome:'failed',stage:'Publication failed; retry is safe',blockers:[String(error.message).slice(0,1000)],completed_at:new Date().toISOString()});}
  return {done:true};
}