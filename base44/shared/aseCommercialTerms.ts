import {contractProjectTerms} from './aseContractProjectTerms.ts';
export const contractQuery=account=>{
  const ids=[account.id,account.dataverse_id].filter(Boolean),supplier=account.account_type==='supplier' || account.relationship_types?.some(type=>['supplier','contractor','consultant'].includes(type));
  return {executed:'yes',$or:[{contractor_id:{$in:ids}},...(supplier ? [{$and:[{account_id:{$in:ids}},{client_account_id:{$nin:ids}}]}] : [])]};
};
export function annualiseTerms(value,start,end) {
  if(typeof value!=='number' || !Number.isFinite(value) || value<=0 || value>1e12) throw new Error('A positive GBP contract value is required.');
  if(![start,end].every(date=>typeof date==='string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0,10)===date)) throw new Error('Valid contract start and end dates are required.');
  const days=(Date.parse(end)-Date.parse(start))/86400000+1;
  if(days<2 || days>36525) throw new Error('Contract end must follow start, within a 100-year term.');
  return {days,annual_value:value*365.25/days};
}
export async function reviewCommercialTerms(base44,account,input,user) {
  if(user.role!=='admin') throw new Error('Only administrators can verify contract terms.');
  if(typeof input.contractId!=='string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(input.contractId)) throw new Error('Choose an accessible contract.');
  const page=await base44.entities.JCT.filter({...contractQuery(account),id:input.contractId},{limit:1});
  const contract=page.items[0];if(!contract) throw new Error('An executed contractor-side contract linked to this account is required.');
  if(input.confirmed!==true || typeof input.reference!=='string' || !input.reference.trim() || input.reference.length>500) throw new Error('Confirm the company-specific GBP value and provide the signed contract reference.');
  const basis=input.dateBasis ?? (input.start && input.end ? 'contract_dates' : 'project_programme');
  if(!['contract_dates','project_programme'].includes(basis)) throw new Error('Choose confirmed contract dates or the project programme.');
  let start=input.start,end=input.end,source='Confirmed contract dates',programmeId='';
  if(basis==='project_programme') {
    const [linked]=await contractProjectTerms(base44,[contract]),programme=linked.recorded_terms;
    if(!programme?.start || !programme?.end) throw new Error('No complete recorded project programme is available. This contract remains excluded from annualisation until programme or contract dates are recorded.');
    start=programme.start;end=programme.end;source=programme.date_source;programmeId=programme.programme_record_id;
  }
  const terms=annualiseTerms(input.value,start,end),reference=input.reference.trim();
  const duplicate=await base44.entities.JCT.count({...contractQuery(account),commercial_reviewed:true,commercial_reference:reference,id:{$ne:contract.id}});
  if(duplicate) throw new Error('This signed contract reference is already included for this account. Use one record per contract.');
  await base44.entities.JCT.update(contract.id,{commercial_value:input.value,commercial_start:start,commercial_end:end,commercial_date_basis:basis,commercial_date_source:source,commercial_programme_record_id:programmeId,commercial_annual_value:terms.annual_value,commercial_reference:reference,commercial_reviewed:true,commercial_reviewed_by:user.id,commercial_reviewed_at:new Date().toISOString()});
  return {saved:true};
}
export async function contractCandidates(base44,account,cursor) {
  const page=await base44.entities.JCT.filter(contractQuery(account),{sort:'document_id',limit:20,...(cursor ? {cursor} : {}),fields:['document_id','project_id','status','date_of_execution','link_to_file','commercial_value','commercial_start','commercial_end','commercial_reference','commercial_reviewed','commercial_reviewed_at','commercial_date_basis','commercial_date_source']});
  return {...page,items:await contractProjectTerms(base44,page.items,account)};
}