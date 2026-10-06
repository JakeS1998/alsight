import {sourceNames,sourceIdentifier} from './aseSourceCommon.ts';
import {retrieveAccounts} from './aseAccountsSource.ts';
import {retrieveGazette} from './aseGazetteSource.ts';
import {retrieveLocalAuthority} from './aseLocalAuthoritySource.ts';
import {retrieveCouncilGovernance} from './aseCouncilGovernance.ts';
import {automaticEvidence,automaticRegistryFacts} from './aseAutomaticEvidence.ts';
const providers={accounts:retrieveAccounts,gazette:retrieveGazette,local_authority:retrieveLocalAuthority,council_governance:retrieveCouncilGovernance};
export async function collectASESource(base44,account,source,user) {
  if(source==='hmrc') throw new Error('HMRC is excluded from automated ASE.');
  if(source!=='registry' && !providers[source]) throw new Error('Unsupported automatic source.');
  const identifier=sourceIdentifier(account,source==='registry' ? 'accounts' : source);
  const canonical=['registry','accounts','gazette'].includes(source) ? {...account,company_number:identifier} : {...account,local_authority_code:identifier};
  if(source==='registry') {
    let audit;
    const read=await base44.functions.invoke('manageCompaniesHouse',{action:'read',accountId:account.id});
    if(read.data.audit && Date.now()-Date.parse(read.data.audit.refreshed_at)<60000) audit=read.data.audit;
    else {const response=await base44.functions.invoke('manageCompaniesHouse',{action:'refresh',accountId:account.id});if(response.data.error) throw new Error(response.data.error);audit=response.data.audit;}
    const page=await base44.entities.ASEEvidence.filter({account_id:account.id,assessment_id:null,source:'Companies House',source_refresh_id:audit.id},{limit:40});
    const rows=automaticRegistryFacts(page.items,audit,canonical);
    if(rows.length) await base44.entities.ASEEvidence.bulkUpdate(rows.map(row=>({id:row.id,score_eligible:row.score_eligible,automatic_eligible:row.automatic_eligible,automatic_reason:row.automatic_reason,automatic_rule_version:row.automatic_rule_version})));
    return {audit,evidenceCount:rows.length,eligibleCount:rows.filter(row=>row.automatic_eligible).length};
  }
  if(!providers[source]) throw new Error('Unsupported automatic source.');
  const query={account_id:account.id,source_key:source,identifier};
  const latest=await base44.entities.ASESourceRefresh.filter(query,{sort:'-refreshed_at',limit:1});
  const recent=latest.items[0];
  if(recent && Date.now()-Date.parse(recent.refreshed_at)<60000) {
    if(!['completed','partial'].includes(recent.status)) {const error=new Error('This source was checked recently; waiting before retry.');error.status=429;error.retryAfter=60;throw error;}
    const page=await base44.entities.ASEEvidence.filter({account_id:account.id,assessment_id:null,source_refresh_id:recent.id},{limit:40});
    const {signed_url}=await base44.integrations.Core.CreateFileSignedUrl({file_uri:recent.raw_file_uri});
    const response=await fetch(signed_url,{signal:AbortSignal.timeout(15000)});if(!response.ok) throw new Error('Recent source snapshot is unavailable.');
    const stored=await response.json(),rows=automaticEvidence(source,canonical,{facts:page.items,raw:stored.data});
    if(rows.length) await base44.entities.ASEEvidence.bulkUpdate(rows.map(row=>({id:row.id,score_eligible:row.score_eligible,automatic_eligible:row.automatic_eligible,automatic_reason:row.automatic_reason,automatic_rule_version:row.automatic_rule_version})));
    return {audit:recent,evidenceCount:rows.length,eligibleCount:rows.filter(row=>row.automatic_eligible).length};
  }
  const attempt=await base44.entities.ASESourceRefresh.create({...query,requested_by:user.id,refreshed_at:new Date().toISOString(),status:'pending'});
  try {
    const result=await providers[source](canonical,identifier,attempt,base44);
    if(!Array.isArray(result.facts) || result.facts.length>40) throw new Error('Source exceeded the safe evidence limit.');
    const current=await base44.entities.Account.get(account.id);if(sourceIdentifier(current,source)!==identifier) throw new Error('Account source identifier changed during collection.');
    const newer=await base44.entities.ASESourceRefresh.filter({...query,status:{$in:['completed','partial']},refreshed_at:{$gt:attempt.refreshed_at}},{limit:1});if(newer.items.length) throw new Error('A newer refresh completed; this response was not applied.');
    const bytes=new TextEncoder().encode(JSON.stringify({source:sourceNames[source],identifier,retrieved_at:attempt.refreshed_at,data:result.raw}));if(bytes.length>3000000) throw new Error('Source snapshot exceeds its safe size limit.');
    const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(b=>b.toString(16).padStart(2,'0')).join('');
    const {file_uri}=await base44.asServiceRole.integrations.Core.UploadPrivateFile({file:new File([bytes],`ase-${source}-${attempt.id}.json`,{type:'application/json'})});
    for(let n=0;n<4;n++){const retired=await base44.entities.ASEEvidence.updateMany({account_id:account.id,assessment_id:null,source:sourceNames[source],external_key:{$exists:true},score_eligible:{$ne:false}},{$set:{score_eligible:false,automatic_eligible:false}});if(!retired.has_more) break;}
    const rows=automaticEvidence(source,canonical,result);
    if(rows.length) await base44.entities.ASEEvidence.upsert(rows.map(row=>({...row,raw_file_uri:file_uri})),{key:'external_key'});
    const eligibleCount=rows.filter(row=>row.automatic_eligible).length;
    const audit=await base44.entities.ASESourceRefresh.update(attempt.id,{status:result.warnings.length ? 'partial' : 'completed',summary:{...result.summary,evidence_count:rows.length,automatic_eligible_count:eligibleCount,verification_status:result.summary.pdf_documents_scanned ? 'Tagged figures use deterministic validation; ALICE PDF transcription has Low confidence and is not independently verified' : 'Deterministic automatic validation; ambiguous evidence remains context'},warnings:result.warnings,raw_file_uri:file_uri,raw_sha256:sha});
    return {audit,evidenceCount:rows.length,eligibleCount};
  } catch(error) {
    await base44.entities.ASESourceRefresh.update(attempt.id,{status:'failed',error:String(error.message).slice(0,1000)});throw error;
  }
}