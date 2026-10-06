import {accountModel} from './asePolicy.ts';
import {sourceIdentifier} from './aseSourceCommon.ts';
import {collectASESource} from './aseCollectSource.ts';
import {gazetteWaitSeconds} from './aseProviderPolicy.ts';
export async function collectV2Sources(base44,account,user,configuration,{refresh=true}={}) {
  const model=accountModel(account),keys=model==='english_local_authority' ? ['local_authority','council_governance'] : ['registry','accounts','gazette'],sources={};
  for(const key of keys) {
    let identifier;
    try {identifier=sourceIdentifier(account,key==='registry' ? 'accounts' : key);}catch(error){sources[key]={state:'UNAVAILABLE',reason:error.message};continue;}
    const query=key==='registry' ? {account_id:account.id,company_number:identifier} : {account_id:account.id,source_key:key,identifier};
    const db=key==='registry' ? base44.entities.CompaniesHouseRefresh : base44.entities.ASESourceRefresh;
    const page=await db.filter(query,{sort:'-refreshed_at',limit:1}),audit=page.items[0],age=audit ? (Date.now()-Date.parse(audit.refreshed_at))/86400000 : Infinity;
    if(audit && ['completed','partial'].includes(audit.status) && age>=0 && age<configuration.freshness_days[key]) {sources[key]={audit,reason:'Current stored source evidence reused.',identifier};continue;}
    if(key==='gazette' && gazetteWaitSeconds()) {sources[key]={state:'UNAVAILABLE',reason:'Gazette refresh is scheduled for the overnight run at 21:15 Europe/London. No current usable stored result is available; no clean or adverse result is inferred.',identifier};continue;}
    if(!refresh) {sources[key]={state:'UNAVAILABLE',reason:'No current successful source snapshot is available after collection. Failed or deferred sources are not treated as clear.',identifier};continue;}
    try {const result=await collectASESource(base44,account,key,user);sources[key]={audit:result.audit,identifier};}
    catch(error){sources[key]={state:'CHECK FAILED',reason:String(error.message).slice(0,500),checked_at:new Date().toISOString(),identifier};}
  }
  return {model,sources};
}
export async function v2SourceFacts(db,account,source) {
  if(!source?.audit) return [];
  const page=await db.ASEEvidence.filter({account_id:account.id,assessment_id:null,source_refresh_id:source.audit.id},{limit:40});
  if(page.has_more) throw new Error('Source evidence exceeded the assessed snapshot limit; no partial score was substituted.');
  return page.items;
}