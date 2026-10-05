import {prepareAssessment} from './aseAssessmentPreview.ts';
import {currentASESourceQuery} from './aseEvidenceSelection.ts';
import {finishASEPublication,syncASECurrent} from './asePublication.ts';
import {automaticRuleVersion} from './aseAutomaticEvidence.ts';
const hash=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(b=>b.toString(16).padStart(2,'0')).join('');
export async function publishAutomatically(base44,account,policy,user,job) {
  const existing=await base44.entities.ASEAssessment.filter({account_id:account.id,automation_key:job.job_key},{limit:1});
  let assessment=existing.items[0],manifest;
  if(assessment?.status==='published') {await syncASECurrent(base44,account.id);return assessment;}
  if(assessment) {
    const {signed_url}=await base44.integrations.Core.CreateFileSignedUrl({file_uri:assessment.evidence_manifest_uri});
    const response=await fetch(signed_url,{signal:AbortSignal.timeout(15000)});if(!response.ok) throw new Error('Frozen publication input is unavailable; resume after restoring access.');
    const text=await response.text();if(text.length>2000000 || await hash(text)!==assessment.evidence_manifest_sha256) throw new Error('Frozen publication input failed integrity validation.');
    manifest=JSON.parse(text);
  } else {
    const ids=(job.sources || []).map(source=>source.audit_id).filter(Boolean);
    const query={...currentASESourceQuery(account),automatic_rule_version:automaticRuleVersion,retrieval_date:{$gte:new Date(Date.now()-86400000).toISOString()},...(job.sources ? {source_refresh_id:{$in:ids}} : {})};
    const prepared=await prepareAssessment(base44,account,policy,undefined,query);
    const {components,...summary}=prepared.result;manifest={evidence:prepared.sourceEvidence,components};
    const text=JSON.stringify(manifest);if(new TextEncoder().encode(text).length>2000000) throw new Error('Publication input exceeds its safe size limit.');
    const {file_uri}=await base44.asServiceRole.integrations.Core.UploadPrivateFile({file:new File([text],`ase-publication-${crypto.randomUUID()}.json`,{type:'application/json'})});
    assessment=await base44.entities.ASEAssessment.create({...summary,account_id:account.id,organisation_type:account.organisation_type || account.company_type,model:prepared.model,assessment_date:prepared.preparedAt,previous_rating:prepared.previous?.displayed_rating ?? null,previous_assessment_id:prepared.previous?.id || '',change:summary.displayed_rating!==null && prepared.previous?.displayed_rating!=null ? summary.displayed_rating-prepared.previous.displayed_rating : null,policy_version:policy.version,policy_snapshot:policy.models,status:'building',is_demo:false,published_by_id:user.id,published_by_name:user.full_name || user.id,reviewed_at:prepared.preparedAt,publication_mode:'automatic',automation_key:job.job_key,automation_run_id:job.run_id || '',evidence_manifest_uri:file_uri,evidence_manifest_sha256:await hash(text),publication_note:'Automatically published under deterministic source-validation rules. No manual approval. HMRC excluded. Empty searches and uncertain records never imply absence. '+(job.run_id ? `Run ${job.run_id}.` : ''),snapshot_evidence_count:prepared.sourceEvidence.length,selected_evidence_count:new Set(components.flatMap(c=>c.evidence_ids)).size});
  }
  return finishASEPublication(base44,assessment,manifest.evidence,manifest.components);
}