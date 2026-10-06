import {aseV2Defaults,validateASEV2Config} from './aseV2Config.ts';
import {calculateASEV2,dependencyScore} from './aseV2Calculation.ts';
import {scoreAllianceContractExposure} from './aseV2DependencyScoring.ts';
export function checkASEV2Rules() {
  const policy=structuredClone(aseV2Defaults),all=policy.components.flatMap(c=>Object.keys(policy.slots[c.key]).map(slot=>({key:`${c.key}:${slot}`,component:c.key,slot,label:slot,state:'CLEAR',score:5,confidence:'High'})));
  const full=calculateASEV2(policy,all),failed=calculateASEV2(policy,all.map(c=>c.key==='esg:environment_agency' ? {...c,state:'CHECK FAILED',score:null} : c));
  const severe=calculateASEV2(policy,all.map(c=>c.key==='adverse:sanctions' ? {...c,state:'ADVERSE',score:1,verified:true,severe_event:'confirmed_material_sanctions'} : c));
  const potential=calculateASEV2(policy,all.map(c=>c.key==='adverse:sanctions' ? {...c,state:'LIMITED',score:null,verified:false,matching_status:'POTENTIAL MATCH',severe_event:'confirmed_material_sanctions'} : c));
  const limited=calculateASEV2(policy,all.map(c=>({...c,state:'LIMITED',score:null}))),stale=calculateASEV2(policy,all.map(c=>c.component==='dependency' ? {...c,quality:0.5} : c));
  let badWeight=false,badState=false,duplicate=false;
  try{validateASEV2Config({...policy,components:policy.components.map(c=>({...c,weight:1}))});}catch{badWeight=true;}
  try{calculateASEV2(policy,[{...all[0],state:'CHECK FAILED',score:1}]);}catch{badState=true;}
  try{calculateASEV2(policy,[all[0],all[0]]);}catch{duplicate=true;}
  const checks={centralWeights:validateASEV2Config(policy).components.reduce((s,c)=>s+c.weight,0)===100,allAssessedContribute:full.final_score===5 && full.coverage===100 && full.components.length===7,cleanGazettePositive:full.components.find(c=>c.key==='adverse').score===5,failedNotAdverse:failed.final_score===5 && failed.coverage===90,missingNotClear:limited.final_score===null && limited.coverage===0,severeCannotAverageAway:severe.final_score===1.5 && severe.raw_score>severe.final_score,potentialNotConfirmed:potential.caps.length===0 && potential.final_score===5,staleChangesConfidenceNotScore:stale.final_score===full.final_score && stale.coverage<full.coverage,nonlinearDependency:dependencyScore(50,policy)===2 && dependencyScore(10,policy)===5,insufficientEvidenceExceptional:calculateASEV2(policy,[all[0]]).final_score===null,badWeightRejected:badWeight,failedScoreRejected:badState,duplicateRejected:duplicate};
  const now=new Date('2026-10-06T12:00:00Z'),turnover={status:'available',value:1000000,currency:'GBP',period_end:'2026-03-31',annual_verified:true,confidence:'High',source_reference:'Filed accounts'};
  const exposure={status:'available',annualised_value:500000,total_contract_value:1000000,included_count:2,excluded_count:0,candidate_count:2,proposal_proxy_count:0,programme_proxy_count:0};
  const scored=scoreAllianceContractExposure(exposure,turnover,policy,now);
  const estimated=scoreAllianceContractExposure({...exposure,proposal_proxy_count:1,programme_proxy_count:1},turnover,policy,now);
  const incomplete=scoreAllianceContractExposure({...exposure,status:'incomplete',excluded_count:1,candidate_count:3},turnover,policy,now);
  const missing=scoreAllianceContractExposure({...exposure,status:'unavailable',annualised_value:null,included_count:0},turnover,policy,now);
  const noTurnover=scoreAllianceContractExposure(exposure,{status:'unavailable'},policy,now);
  const zeroTurnover=scoreAllianceContractExposure(exposure,{...turnover,value:0},policy,now);
  const pdf=scoreAllianceContractExposure(exposure,{...turnover,annual_verified:false,confidence:'Low'},policy,now);
  const applied=calculateASEV2(policy,all.map(c=>c.component==='dependency' ? estimated.check : c));
  Object.assign(checks,{contractExposureScored:scored.dependency.percentage===50 && scored.check.score===2,annualisedExposureNotWholeContractValue:scored.dependency.exposure===500000,pathwayExposureScored:estimated.check.score===2 && estimated.check.confidence==='Low' && estimated.check.verified===false,incompleteExposureScoredWithLowerConfidence:incomplete.check.score===2 && incomplete.check.quality===policy.quality.Low,missingExposureNotZeroDependency:missing.check.score===null && missing.dependency.status==='unavailable',missingTurnoverNotScored:noTurnover.check.score===null,zeroTurnoverNotScored:zeroTurnover.check.score===null,pdfTurnoverLowConfidence:pdf.check.score===2 && pdf.check.confidence==='Low',exposureFeedsDependencyComponent:applied.components.find(c=>c.key==='dependency').score===2,exposureFeedsWeightedASE:applied.raw_score===4.55 && applied.final_score===4.55 && applied.coverage===92.5});
  return {checks,passed:Object.values(checks).every(Boolean)};
}