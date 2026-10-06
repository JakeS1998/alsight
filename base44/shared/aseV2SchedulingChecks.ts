import {aseV2Defaults} from './aseV2Config.ts';
import {collectV2Sources} from './aseV2Collect.ts';
import {gazetteWaitSeconds} from './aseProviderPolicy.ts';
export async function checkASEV2Scheduling() {
 const now=new Date('2026-10-06T11:00:00Z'),account={id:'scheduling-check',name:'Scheduling check',organisation_type:'uk_limited_company',company_number:'02999852'};
 const mock=stale=>({entities:{CompaniesHouseRefresh:{filter:async()=>({items:[{id:'registry',status:'completed',refreshed_at:new Date(now.getTime()-3600000).toISOString()}]})},ASESourceRefresh:{filter:async query=>({items:[{id:query.source_key,status:'completed',refreshed_at:new Date(now.getTime()-(query.source_key==='gazette' && stale ? 172800000 : 3600000)).toISOString()}]})}}});
 const deferred=await collectV2Sources(mock(true),account,{id:'check'},aseV2Defaults,{now}),cached=await collectV2Sources(mock(false),account,{id:'check'},aseV2Defaults,{now});
 const checks={daytimeUpdateContinues:!!deferred.sources.registry.audit && !!deferred.sources.accounts.audit,expiredGazetteDeferred:deferred.sources.gazette.state==='UNAVAILABLE' && !deferred.sources.gazette.audit,currentGazetteReusedDuringDay:cached.sources.gazette.audit?.id==='gazette',ukDaytimeBlocked:gazetteWaitSeconds(now)>0,ukNighttimeAllowed:gazetteWaitSeconds(new Date('2026-10-06T20:15:00Z'))===0,winterNighttimeAllowed:gazetteWaitSeconds(new Date('2026-12-06T21:15:00Z'))===0};
 return {checks,passed:Object.values(checks).every(Boolean)};
}