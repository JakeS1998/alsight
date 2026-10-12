import {environmentMatch,environmentIdentifier,environmentReference} from './aseEnvironmentIdentity.ts';
import {environmentAgencyCheck} from './aseEnvironmentCheck.ts';
export function checkEnvironmentRules() {
 const account={account_type:'supplier',name:'Example Limited',company_number:'12345678',address_postcode:'SW1A 1AA'};
 const action={offender:{name:'EXAMPLE LTD',hasAddress:{address:'London SW1A 1AA'}}};
 const empty=environmentAgencyCheck(account,{audit:{refreshed_at:'2026-10-12T12:00:00Z',summary:{complete:true,records:[]}}});
 const failed=environmentAgencyCheck(account,{state:'CHECK FAILED',reason:'HTTP 503'});
 const match=environmentMatch(account,{holder:{name:'Example Limited',companyNumber:'12345678'}},true);
 const wrong=environmentMatch(account,{holder:{name:'Example Limited',companyNumber:'87654321'}},true);
 const changed=environmentIdentifier({...account,address_postcode:'SW1A 2AA'});
 return {environmentEmptyNotClear:empty.state==='LIMITED' && empty.score===null && !empty.verified,environmentFailureNotAdverse:failed.state==='CHECK FAILED' && failed.score===null,environmentNumberMatch:match==='Exact company number',environmentWrongNumberRejected:wrong==='Different company number',environmentNameAddressNeedsReview:environmentMatch(account,action).includes('identity review required'),environmentIdentifierTracksAddress:changed!==environmentIdentifier(account),environmentUnsafeLinksRejected:environmentReference('https://example.com/registration/1')==='',environmentHttpsSource:environmentReference('http://environment.data.gov.uk/public-register/enforcement-action/registration/123')==='https://environment.data.gov.uk/public-register/enforcement-action/registration/123'};
}