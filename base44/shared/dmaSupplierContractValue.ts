import {isDMAContractValue} from './hensallDMAContractValue.ts';
const aliases=account=>[account.id,account.dataverse_id].filter(Boolean);
export function dmaSupplierContractorAccount(contract,accounts) {
 const contractor=accounts.filter(account=>aliases(account).includes(contract.contractor_id)&&!aliases(account).includes(contract.client_account_id));
 if(contractor.length===1)return contractor[0].id;
 if(contractor.length>1)return '';
 const supplier=accounts.filter(account=>aliases(account).includes(contract.account_id)&&!aliases(account).includes(contract.client_account_id));
 return supplier.length===1?supplier[0].id:'';
}
export function dmaContractValueCandidates(row,candidates,accounts) {
 if(!isDMAContractValue(row))return [];
 return candidates.filter(document=>accounts.some(account=>aliases(account).includes(document.account_id)));
}
export function checkDMASupplierRules() {
 const a={id:'supplier-a',dataverse_id:'a-guid'},b={id:'supplier-b',dataverse_id:'b-guid'},row={role:'Contract Value',quote:'Contract Value £100,000'},documents=[{id:'jct-a',account_id:'supplier-a'}];
 return {contractValueUsesLinkedSupplier:dmaContractValueCandidates(row,documents,[a,b])[0]?.id==='jct-a',resolvedContractorHasPriority:dmaSupplierContractorAccount({contractor_id:'b-guid',account_id:'a-guid'},[a,b])==='supplier-b',supplierAccountFallback:dmaSupplierContractorAccount({contractor_id:'missing',account_id:'a-guid'},[a,b])==='supplier-a',clientExcluded:dmaSupplierContractorAccount({account_id:'a-guid',client_account_id:'a-guid'},[a,b])==='',duplicateIdentityExcluded:dmaSupplierContractorAccount({account_id:'a-guid'},[a,{id:'duplicate',dataverse_id:'a-guid'}])==='',wrongCostPlanLineExcluded:dmaContractValueCandidates({role:'Project Total',quote:'Project Total £100,000'},documents,[a,b]).length===0};
}