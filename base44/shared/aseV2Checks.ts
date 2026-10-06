import {aseV2Defaults,validateASEV2Config} from './aseV2Config.ts';
import {calculateASEV2,dependencyScore} from './aseV2Calculation.ts';
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
  return {checks,passed:Object.values(checks).every(Boolean)};
}