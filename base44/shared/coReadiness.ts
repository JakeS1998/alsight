import {requireAdmin,tests,ready} from './coCore.ts';
import {legalFolderQuery} from './coProjectLegalFolders.ts';
export async function contingencyReadiness(b,m,c){
 requireAdmin(m);const E=b.asServiceRole.entities,scope=m.global?{}:{id:{$in:m.dataset_ids}};
 const [groups,exceptions,linked,covered]=await Promise.all([
  E.CODataset.aggregate({query:{...scope,enabled:true},groupBy:'interval_minutes'}),
  E.COFileException.count({status:'open'}),
  E.Project.count(legalFolderQuery),
  E.CODataset.count({...scope,enabled:true,'mapping.auto_project_legals':true})
 ]);
 const rows=groups.rows||[],total=rows.reduce((n,row)=>n+row.count,0),counts=[];
 for(let start=0;start<rows.length;start+=6){
  const batch=await Promise.all(rows.slice(start,start+6).map(row=>E.CODataset.count({...scope,enabled:true,interval_minutes:row.interval_minutes,$or:[{'state.last_success':{$exists:false}},{'state.last_success':{$in:[null,'']}},{'state.last_success':{$lt:new Date(Date.now()-Number(row.interval_minutes||60)*60000).toISOString()}},{'state.error':{$exists:true,$nin:[null,'']}}]})));
  counts.push(...batch);
 }
 const pendingSources=counts.reduce((n,count)=>n+count,0),coverage=c.policy?.project_legals||{},missingTests=tests.filter(test=>!c.acceptance?.[test]?.passed||c.acceptance[test].evidence?.trim().length<10);
 const blockers=[];
 if(!c.enabled||c.mode!=='production')blockers.push('Production standby replication is not enabled.');
 if(!c.health?.dataverse?.ok||!c.health?.sharepoint?.ok)blockers.push('Both Microsoft connection checks must have recorded success.');
 if(!total)blockers.push('No enabled backup sources are configured.');
 if(groups.truncated)blockers.push('Source freshness summary is incomplete.');
 if(pendingSources)blockers.push(`${pendingSources} enabled sources have no completed copy, are overdue, or report an error.`);
 if(linked&&(!coverage.enabled||!coverage.last_scan||coverage.scan_in_progress))blockers.push('Project-folder discovery has not completed a full approved scan.');
 if(coverage.errors?.length)blockers.push(`${coverage.errors.length} project folder links need review.`);
 if(covered!==linked)blockers.push(`${covered} enabled project-folder sources are configured for ${linked} linked projects; full coverage is not confirmed.`);
 if(exceptions)blockers.push(`${exceptions} files have unresolved backup exceptions.`);
 if(missingTests.length)blockers.push(`${missingTests.length} acceptance checks lack a recorded pass with evidence.`);
 return {checked_at:new Date().toISOString(),operational_checks_complete:!blockers.length&&ready(c),blockers,source_count:total,pending_sources:pendingSources,linked_projects:linked,configured_project_sources:covered,open_file_exceptions:exceptions,missing_tests:missingTests,limitations:['A readiness summary does not run the acceptance tests or prove file restoration.','Business-owner acceptance must be obtained before declaring outage readiness.']};
}