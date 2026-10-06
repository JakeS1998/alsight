import {withASEAutomationLease} from './aseAutomationLease.ts';
import {findExactCompanyName} from './companyNameMatching.ts';
import {hasCouncilName} from './aseCouncilName.ts';
export const missingCompanyNumber={$or:[{company_number:{$exists:false}},{company_number:null},{company_number:{$regex:'^\\s*$'}}]};
const scope={...missingCompanyNumber,name:{$regex:'^(?!ASE Demo)'},organisation_type:{$ne:'english_local_authority'}};
export async function companyNameLookupRun(base44,user,input) {
  const db=base44.entities;
  return withASEAutomationLease(base44,async()=>{
    if(input.action==='nameLookupStart') {
      const existing=await db.CompanyNameLookupRun.filter({status:'running'},{limit:1});
      if(existing.items.length) return {run:existing.items[0],already_running:true};
      const count=await db.Account.count(scope),now=new Date().toISOString();
      return {run:await db.CompanyNameLookupRun.create({status:count ? 'running' : 'completed',eligible_count:count,cursor:'',dispatch_token:crypto.randomUUID(),requested_by:user.id,started_at:now,last_activity:now,retry_count:0})};
    }
    const run=await db.CompanyNameLookupRun.get(input.runId);
    if(!run || run.status!=='running' || run.dispatch_token!==input.token) return {skipped:true};
    const page=await db.Account.filter({...scope,created_date:{$lte:run.started_at}},{sort:'id',limit:1,...(run.cursor ? {cursor:run.cursor} : {})}),account=page.items[0];
    if(!account) return {run:await db.CompanyNameLookupRun.update(run.id,{status:'completed',completed_at:new Date().toISOString()})};
    const jobKey=`${run.id}:${account.id}`,existing=await db.CompanyNameLookupResult.filter({job_key:jobKey},{limit:1});
    if(!existing.items.length) {
      let outcome;
      try {
        outcome=hasCouncilName(account) ? {outcome:'skipped',note:'Council or public-authority record; not treated as a Companies House company.'} : await findExactCompanyName(account);
        if(outcome.outcome==='matched') {
          const saved=await db.Account.updateMany({id:account.id,name:account.name,...missingCompanyNumber},{$set:{company_number:outcome.company_number}});
          if(!saved.updated) outcome={outcome:'skipped',note:'The profile name or company number changed during lookup. Existing details were preserved.'};
        }
      } catch(error) {
        if(Number(error.status || error.response?.status)===429 && (run.retry_count || 0)<3) {
          return {run:await db.CompanyNameLookupRun.update(run.id,{retry_count:(run.retry_count || 0)+1,dispatch_token:crypto.randomUUID(),last_activity:new Date().toISOString()}),retry:true};
        }
        outcome={outcome:'failed',note:String(error.message).slice(0,1000)};
      }
      await db.CompanyNameLookupResult.upsert([{job_key:jobKey,run_id:run.id,account_id:account.id,account_name:account.name,checked_at:new Date().toISOString(),...outcome}],{key:'job_key'});
    }
    return {run:await db.CompanyNameLookupRun.update(run.id,{cursor:page.next_cursor || '',dispatch_token:crypto.randomUUID(),retry_count:0,last_activity:new Date().toISOString(),...(!page.has_more ? {status:'completed',completed_at:new Date().toISOString()} : {})})};
  },'company-name-lookup-run');
}