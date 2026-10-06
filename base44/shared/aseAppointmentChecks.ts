import {appointmentContractExposure} from './aseAppointmentExposure.ts';
export async function checkAppointmentExposure() {
  const account={id:'company',company_number:'SC358148'},date='2026-10-06';
  const document={project_id:'project-ref',document_type:'appointment_pm',document_id:'BSS-appointment',count:1,sum_total_fees:120000};
  const delivery={id:'programme',project_id:'project-ref',contract_start:'2026-01-01',forecast_pc:'2026-12-31',delivery_team:JSON.stringify([{role:'Project Manager',supplier_company_number:'SC358148',fees:{riba_1:20000,riba_5_7:40000}}])};
  const assess=async (rows=[document],programme=delivery)=>{
    const db={LegalDocument:{aggregate:async()=>({rows,truncated:false})},Project:{filter:async()=>({items:[{id:'project',dataverse_id:'project-ref',name:'Appointment project'}]})},ProjectDelivery:{filter:async()=>({items:[programme]})},FeeProposal:{filter:async()=>({items:[{id:'proposal',project_id:'project-ref',revision_number:2,status:'accepted'}]})}};
    return appointmentContractExposure({entities:db},account,date);
  };
  const recorded=await assess(),pathway=await assess([{...document,sum_total_fees:0}]);
  const missing=await assess([{...document,sum_total_fees:0}],{...delivery,delivery_team:'[]'});
  const wrongCompany=await assess([{...document,sum_total_fees:0}],{...delivery,delivery_team:delivery.delivery_team.replace('SC358148','SC000001')});
  const wrongRole=await assess([{...document,sum_total_fees:0}],{...delivery,delivery_team:delivery.delivery_team.replace('Project Manager','Architect')});
  const noDates=await assess([document],{...delivery,forecast_pc:''});
  const expired=await assess([document],{...delivery,contract_start:'2025-01-01',forecast_pc:'2025-12-31'});
  const duplicate=await assess([document,{...document,document_id:'BSS-replacement'}]);
  const checks={signedProfessionalAppointmentsCounted:recorded.candidate_count===1 && recorded.included_count===1,recordedAppointmentFeeUsed:recorded.total_contract_value===120000 && recorded.contracts[0].commercial_effective_mode==='appointment_fee',appointmentAnnualised:Math.abs(recorded.annualised_value-120000*365.25/365)<0.000001,programmeProxyDisclosed:recorded.programme_proxy_count===1,pathwayProfessionalFeeUsed:pathway.total_contract_value===60000 && pathway.proposal_proxy_count===1,missingFeeNotZeroIncome:missing.candidate_count===1 && missing.included_count===0 && missing.excluded_count===1 && missing.warnings.length===1,wrongCompanyExcluded:wrongCompany.included_count===0,wrongRoleExcluded:wrongRole.included_count===0,missingDatesExcluded:noDates.included_count===0,expiredProgrammeExcluded:expired.included_count===0,replacementNotDoubleCounted:duplicate.candidate_count===2 && duplicate.included_count===0};
  return {checks,passed:Object.values(checks).every(Boolean)};
}