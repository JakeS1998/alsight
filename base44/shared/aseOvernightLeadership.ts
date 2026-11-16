import {startLeadershipRun,advanceLeadershipRun} from './aseLeadershipRuns.ts';
import {getASEV2Policy} from './aseV2Config.ts';
export async function advanceOvernightLeadership(base44,job,account,user,assertLease) {
  const db=base44.entities,prior=(job.sources || []).find(s=>s.key==='leadership');
  let outcome;
  try {
    const policy=await getASEV2Policy(db);
    let screening;
    if(prior?.audit_id) {
      screening=await db.ASELeadershipRun.get(prior.audit_id);
      if(screening.account_id!==account.id || screening.company_number!==String(account.company_number || '').toUpperCase().replace(/\s/g,'').padStart(8,'0')) throw new Error('Company identity changed during leadership screening; no result inferred.');
      screening=await advanceLeadershipRun(db,screening,policy.configuration.leadership,assertLease);
    } else {
      screening=await startLeadershipRun(db,account,user,policy.configuration.leadership,{after:job.created_date});
    }
    await assertLease();
    const finished=screening.status==='completed',failed=(screening.checks || []).filter(c=>c.match_status==='CHECK FAILED');
    outcome={key:'leadership',audit_id:screening.id,status:finished ? (failed.length ? 'partial' : 'completed') : 'processing',warnings:(screening.warnings || []).slice(0,6),error:failed.length ? `${failed.length} leadership source checks failed; unsupported conclusions remain unscored.` : ''};
  } catch(error) {
    if(error.status===429 && (job.retry_count || 0)<3) {
      await db.ASEAutomationAccount.update(job.id,{retry_count:(job.retry_count || 0)+1,stage:'Backing off leadership source checks'});
      return {done:false,waitFor:`PT${Math.max(60,error.retryAfter || 300)}S`};
    }
    outcome={key:'leadership',status:'failed',error:String(error.message).slice(0,1000)};
  }
  const sources=[...(job.sources || []).filter(s=>s.key!=='leadership'),outcome];
  await db.ASEAutomationAccount.update(job.id,{sources,retry_count:0,stage:`Leadership & Control: ${outcome.status}`,failed_sources_count:sources.filter(s=>s.status==='failed').length});
  return {done:false,waitFor:'PT15S'};
}