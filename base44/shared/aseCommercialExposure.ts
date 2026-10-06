import {syncCommercialInputs} from './aseCommercialInputs.ts';
import {appointmentContractExposure} from './aseAppointmentExposure.ts';
export async function commercialContractExposure(base44,account,date) {
  const ids=await syncCommercialInputs(base44,account),db=base44.entities,candidateQuery={id:{$in:ids}};
  const eligible={...candidateQuery,commercial_effective_value:{$gt:0},commercial_effective_annual_value:{$gt:0},commercial_effective_reference:{$exists:true,$nin:['',null]},commercial_effective_start:{$lte:date},commercial_effective_end:{$gte:date}};
  const grouped=await db.JCT.aggregate({query:eligible,groupBy:['commercial_effective_reference','commercial_effective_date_basis','commercial_effective_mode'],sum:['commercial_effective_annual_value','commercial_effective_value'],limit:1000});
  if(grouped.truncated) return {status:'unavailable',reason:'Contract totals exceed the validation limit.'};
  const referenceCounts=new Map();
  grouped.rows.forEach(row=>referenceCounts.set(row.commercial_effective_reference,(referenceCounts.get(row.commercial_effective_reference) || 0)+row.count));
  const duplicateRefs=[...referenceCounts].filter(([,count])=>count>1).map(([reference])=>reference);
  if(duplicateRefs.length) eligible.commercial_effective_reference={$exists:true,$nin:['',null,...duplicateRefs]};
  const rows=grouped.rows.filter(row=>!duplicateRefs.includes(row.commercial_effective_reference)),candidateCount=await db.JCT.count(candidateQuery);
  const appointments=await appointmentContractExposure(base44,account,date);
  const included=rows.reduce((sum,row)=>sum+row.count,0)+appointments.included_count,allCount=candidateCount+appointments.candidate_count,excluded=allCount-included;
  return {status:included ? excluded ? 'incomplete' : 'available' : 'unavailable',eligible,duplicateRefs,
    annualised_value:included ? rows.reduce((sum,row)=>sum+row.sum_commercial_effective_annual_value,0)+appointments.annualised_value : null,
    total_contract_value:included ? rows.reduce((sum,row)=>sum+row.sum_commercial_effective_value,0)+appointments.total_contract_value : null,
    included_count:included,excluded_count:excluded,candidate_count:allCount,appointment_count:appointments.candidate_count,appointment_included_count:appointments.included_count,appointment_contracts:appointments.contracts,warnings:appointments.warnings,
    programme_proxy_count:rows.filter(row=>row.commercial_effective_date_basis==='project_programme').reduce((sum,row)=>sum+row.count,0)+appointments.programme_proxy_count,
    proposal_proxy_count:rows.filter(row=>row.commercial_effective_mode==='pathway_proposal').reduce((sum,row)=>sum+row.count,0)+appointments.proposal_proxy_count,
    reason:included ? '' : 'No current signed contracts or professional appointments have usable company-specific values and term dates; missing evidence is not zero exposure.'};
}