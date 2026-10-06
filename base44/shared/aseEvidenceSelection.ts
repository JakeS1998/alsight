import {normaliseCompanyNumber} from './companiesHouseData.ts';
import {sourceIdentifier,evidencePrefix} from './aseSourceCommon.ts';
export function currentASESourceQuery(account) {
  let companyNumber=null;
  try {companyNumber=normaliseCompanyNumber(account.company_number);} catch { /* Unmatched registry evidence cannot contribute. */ }
  const importedPrefixes=[];
  for(const key of ['accounts','gazette','hmrc','local_authority','council_governance']) {try {importedPrefixes.push(evidencePrefix(account,key,sourceIdentifier(account,key)));}catch { /* Missing identifiers exclude old imported evidence. */ }}
  const importedPattern=importedPrefixes.length ? `^(?:${importedPrefixes.map(prefix=>prefix.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')})` : '^no-current-source:';
  return {account_id:account.id,assessment_id:null,source:{$ne:'Blackflag Alert'},$or:[{source:'Companies House',company_number:companyNumber || '__unmatched__'},{source:{$ne:'Companies House'},external_key:{$exists:false}},{source:{$ne:'Companies House'},external_key:null},{source:{$ne:'Companies House'},external_key:{$regex:importedPattern}}]};
}