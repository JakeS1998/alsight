export const contractQuery=account=>{
  const ids=[account.id,account.dataverse_id].filter(Boolean),supplier=account.account_type==='supplier' || account.relationship_types?.some(type=>['supplier','contractor','consultant'].includes(type));
  return {status:'active',executed:'yes',$or:[{contractor_id:{$in:ids}},...(supplier ? [{$and:[{account_id:{$in:ids}},{client_account_id:{$nin:ids}},{contractor_id:{$in:['',null]}}]}] : [])]};
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
  const contract=page.items[0];if(!contract) throw new Error('An active, executed contractor-side contract linked to this account is required.');
  if(input.confirmed!==true || typeof input.reference!=='string' || !input.reference.trim() || input.reference.length>500) throw new Error('Confirm the company-specific GBP value and provide the signed contract reference.');
  const terms=annualiseTerms(input.value,input.start,input.end),reference=input.reference.trim();
  const duplicate=await base44.entities.JCT.count({...contractQuery(account),commercial_reviewed:true,commercial_reference:reference,id:{$ne:contract.id}});
  if(duplicate) throw new Error('This signed contract reference is already included for this account. Use one record per contract.');
  await base44.entities.JCT.update(contract.id,{commercial_value:input.value,commercial_start:input.start,commercial_end:input.end,commercial_annual_value:terms.annual_value,commercial_reference:reference,commercial_reviewed:true,commercial_reviewed_by:user.id,commercial_reviewed_at:new Date().toISOString()});
  return {saved:true};
}
export async function contractCandidates(base44,account,cursor) {
  const page=await base44.entities.JCT.filter(contractQuery(account),{sort:'document_id',limit:20,...(cursor ? {cursor} : {}),fields:['document_id','project_id','commercial_value','commercial_start','commercial_end','commercial_reference','commercial_reviewed','commercial_reviewed_at']});
  return page;
}