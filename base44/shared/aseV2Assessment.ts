import {collectV2Sources,v2SourceFacts} from './aseV2Collect.ts';
import {externalV2Checks} from './aseV2ExternalChecks.ts';
import {allianceV2Checks} from './aseV2AllianceChecks.ts';
import {calculateASEV2,explainASEV2} from './aseV2Calculation.ts';
import {leadershipAssessment} from './aseLeadershipAssessment.ts';
import {publishV2Current} from './aseV2Publication.ts';
import {supplierProfessionalIndemnity,professionalIndemnityCheck} from './aseProfessionalIndemnity.ts';
export async function createASEV2Assessment(base44,account,user,policy,assertLease,{refreshSources=true,automationKey=''}={}) {
  if(automationKey){const saved=await base44.entities.ASEV2Assessment.filter({account_id:account.id,automation_key:automationKey},{limit:1});if(saved.items[0]){await assertLease();return publishV2Current(base44.entities,saved.items[0]);}}
  const collection=await collectV2Sources(base44,account,user,policy.configuration,{refresh:refreshSources}),facts={};
  for(const [key,source] of Object.entries(collection.sources)) facts[key]=await v2SourceFacts(base44.entities,account,source);
  const alliance=await allianceV2Checks(base44,account,policy.configuration),control=await leadershipAssessment(base44,account,policy.configuration,collection),checks=[...externalV2Checks(account,policy.configuration,collection,facts).filter(c=>!(c.component==='profile' && c.slot==='ownership') && !(c.component==='adverse' && c.slot==='sanctions')),...control.checks,...alliance.checks];
  const insurance=professionalIndemnityCheck(await supplierProfessionalIndemnity(base44.entities,account));
  if(insurance)checks.push(insurance);
  const result=calculateASEV2(policy.configuration,checks),db=base44.entities;
  const [previousPage,legacy]=await Promise.all([db.ASEV2Current.filter({account_id:account.id},{limit:1}),db.ASECurrentRating.filter({account_id:account.id},{limit:1})]),previous=previousPage.items[0],previousAssessment=previous ? await db.ASEV2Assessment.get(previous.assessment_id) : null;
  const drivers=previousAssessment ? result.components.flatMap(c=>{const old=previousAssessment.components.find(r=>r.key===c.key);return old?.score!==c.score ? [`${c.label}: ${old?.score==null ? 'unavailable' : old.score.toFixed(2)} → ${c.score===null ? 'unavailable' : c.score.toFixed(2)}. Evidence: ${checks.filter(check=>check.component===c.key).map(check=>check.reason).join(' ').slice(0,500)}`] : [];}) : ['First ASE v2 assessment; legacy assessments are retained, not converted into v2 evidence.'];
  if(previousAssessment?.dependency?.percentage!==alliance.dependency.percentage && Number.isFinite(alliance.dependency.percentage)) drivers.push(`Alliance Dependency: ${previousAssessment?.dependency?.percentage ?? 'unavailable'}% → ${alliance.dependency.percentage.toFixed(1)}%.`);
  await assertLease();
  const assessment=await db.ASEV2Assessment.create({...result,account_id:account.id,methodology:'ASE v2',assessment_date:new Date().toISOString(),policy_version:policy.version,policy_snapshot:policy.configuration,checks,dependency:alliance.dependency,experience:alliance.experience,leadership:control.leadership,drivers:drivers.slice(0,12),explanation:(explainASEV2(result,checks)+' '+control.leadership.explanation).slice(0,10000),previous_assessment_id:previous?.assessment_id || '',legacy_assessment_id:legacy.items[0]?.assessment_id || '',assessed_by:user.id,automation_key:automationKey,assessment_note:'ASE v2 reassessment. Current stored sources reused only within configured freshness. Approved daytime sources may refresh during the day; Gazette collection is overnight only, with deferred or expired evidence explicitly unavailable. Unconfigured providers are unavailable, never silently cleared.'});
  await assertLease();
  return publishV2Current(db,assessment);
}