import {bulkASEAccountQuery} from './aseBulkPublication.ts';
import {accountModel} from './asePolicy.ts';
import {councilNameQuery} from './aseCouncilName.ts';
export const liveASEQuery={status:{$ne:'inactive'},name:{$regex:'^(?!ASE Demo)'}};
export const supportedASEQuery={...bulkASEAccountQuery,status:{$ne:'inactive'}};
export const validASEId=value=>typeof value==='string' && /^[a-zA-Z0-9_-]{1,64}$/.test(value);
export const aseModeQuery=mode=>({source_mode:mode==='gazette' ? 'gazette' : {$ne:'gazette'}});
export const asePortfolioQuery=mode=>mode==='gazette' ? {...supportedASEQuery,$nor:[councilNameQuery,{organisation_type:{$regex:'^english[ _]local[ _]authority$',$options:'i'}}]} : supportedASEQuery;
export async function aseAutomationScope(base44,accountId,sourceMode='assessment') {
  if(accountId) {
    if(!validASEId(accountId)) throw new Error('Valid Account required.');
    const account=await base44.entities.Account.get(accountId);
    if(!account || account.name.startsWith('ASE Demo') || account.status==='inactive' || !accountModel(account)) throw new Error('Automatic ASE supports live companies and English local authorities only; check the Account organisation type.');
    return {scope:'account',account_id:account.id,eligible_count:1,excluded_count:0};
  }
  const [total,eligible]=await Promise.all([base44.entities.Account.count(liveASEQuery),base44.entities.Account.count(asePortfolioQuery(sourceMode))]);
  return {scope:'portfolio',account_id:'',eligible_count:eligible,excluded_count:total-eligible};
}