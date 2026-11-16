const normalise=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
export const isHensall=account=>account?.company_number==='02999852';
export const isDMAContractValue=row=>['contractvalue','contractsum'].includes(normalise(row.role))&&new RegExp(`\\bcontract\\s+${normalise(row.role)==='contractvalue'?'value':'sum'}\\b`,'i').test(row.quote||'');
export function dmaContractorAccount(contract,accounts) {
 const matches=accounts.filter(account=>isHensall(account)&&[account.id,account.dataverse_id].filter(Boolean).some(id=>id===contract.contractor_id||id===contract.account_id&&id!==contract.client_account_id));
 return matches.length===1?matches[0].id:contract.contractor_id||contract.account_id;
}
export function hensallContractValueCandidates(row,candidates,accounts) {
 if(!isDMAContractValue(row))return [];
 return candidates.filter(document=>accounts.some(account=>isHensall(account)&&[account.id,account.dataverse_id].includes(document.account_id)));
}
export function checkHensallDMARules() {
 const hensall={id:'hensall',dataverse_id:'hensall-guid',company_number:'02999852'},other={id:'other',company_number:'00000001'},row={role:'Contract Value',quote:'Contract Value £100,000'},documents=[{id:'jct-hensall',account_id:'hensall',document_type:'contractor'},{id:'jct-other',account_id:'other',document_type:'contractor'}];
 return {contractValueRecognised:isDMAContractValue(row),contractSumRecognised:isDMAContractValue({role:'Contract Sum',quote:'Contract Sum £100,000'}),mislabeledSumExcluded:!isDMAContractValue({role:'Contract Value',quote:'Contract Sum £100,000'}),wrongLineExcluded:!isDMAContractValue({role:'Contractor Fee',quote:'Contractor Fee £100,000'}),missingQuoteExcluded:!isDMAContractValue({...row,quote:''}),unnamedValueOnlyHensall:hensallContractValueCandidates(row,documents,[hensall,other]).map(d=>d.id).join()==='jct-hensall',contractAccountResolved:dmaContractorAccount({account_id:'hensall-guid',contractor_id:'unresolved'},[hensall])==='hensall',clientNotContractor:dmaContractorAccount({account_id:'hensall-guid',client_account_id:'hensall-guid',contractor_id:'other'},[hensall])==='other'};
}