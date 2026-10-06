import {contractProjectTerms} from './aseContractProjectTerms.ts';
import {annualiseTerms} from './aseCommercialTerms.ts';
export async function appointmentContractExposure(base44,account,date) {
  const aliases=[account.id,account.dataverse_id].filter(Boolean);
  const grouped=await base44.entities.LegalDocument.aggregate({query:{account_id:{$in:aliases},executed:'yes',document_type:{$in:['appointment_pm','appointment_pd_cdm','appointment_architect','appointment_pd_br']}},groupBy:['project_id','document_type','document_id'],sum:'total_fees',limit:1000});
  if(grouped.truncated) throw new Error('Signed appointment totals exceed the validation limit; no partial exposure is inferred.');
  const candidateCount=grouped.rows.reduce((sum,row)=>sum+row.count,0),roleCounts=new Map();
  for(const row of grouped.rows) {const key=`${row.project_id}:${row.document_type}`;roleCounts.set(key,(roleCounts.get(key) || 0)+row.count);}
  let annual=0,total=0,included=0,proposalCount=0,missingTerms=0,outsideTerm=0,duplicates=0;
  const contracts=[];
  for(let index=0;index<grouped.rows.length;index+=20) {
    const linked=await contractProjectTerms(base44,grouped.rows.slice(index,index+20),account);
    for(const row of linked) {
      if(roleCounts.get(`${row.project_id}:${row.document_type}`)>1) {duplicates+=row.count;continue;}
      const recorded=Number.isFinite(row.sum_total_fees) && row.sum_total_fees>0,value=recorded ? row.sum_total_fees : row.pathway_terms?.value;
      const start=row.recorded_terms?.start,end=row.recorded_terms?.end;
      if(!value || !start || !end) {missingTerms+=row.count;continue;}
      let terms;try {terms=annualiseTerms(value,start,end);}catch {missingTerms+=row.count;continue;}
      if(start>date || end<date) {outsideTerm+=row.count;continue;}
      annual+=terms.annual_value;total+=value;included++;if(!recorded) proposalCount++;
      if(contracts.length<20) contracts.push({id:`appointment:${row.project_id}:${row.document_type}`,document_id:row.document_id,project_id:row.project_id,commercial_effective_value:value,commercial_effective_annual_value:terms.annual_value,commercial_effective_start:start,commercial_effective_end:end,commercial_effective_reference:row.document_id,commercial_effective_date_basis:'project_programme',commercial_effective_mode:recorded ? 'appointment_fee' : 'pathway_proposal',commercial_effective_source:{project_name:row.project_name,project_id:row.project_record_id,date_source:row.recorded_terms.date_source,...(!recorded ? row.pathway_terms : {source:'Recorded company-specific signed professional appointment fee; project programme dates are an estimate.'})}});
    }
  }
  const warnings=[];
  if(missingTerms) warnings.push(`${missingTerms} signed professional appointment(s) are linked to this company but lack a usable recorded appointment fee or company-and-role matched Pathway fee and complete programme dates. Their existence is not treated as zero income.`);
  if(outsideTerm) warnings.push(`${outsideTerm} signed professional appointment(s) are outside the current recorded programme term.`);
  if(duplicates) warnings.push(`${duplicates} appointment record(s) sharing a project and role are excluded to avoid counting original and replacement appointments twice.`);
  if(included>contracts.length) warnings.push('The professional appointment total includes all eligible appointments; the evidence view retains the first 20 appointment inputs.');
  return {annualised_value:annual,total_contract_value:total,included_count:included,candidate_count:candidateCount,excluded_count:candidateCount-included,proposal_proxy_count:proposalCount,programme_proxy_count:included,contracts,warnings};
}