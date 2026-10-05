import {accountModel} from './asePolicy.ts';
export function checkAccountModelRules() {
  const council=name=>accountModel({name,organisation_type:'uk_limited_company'})==='english_local_authority';
  return {
    councilNameMixedCase:council('Example CoUnCiL'),
    councilNameCMarker:council('Example_C account'),
    councilNameBCMarker:council('Example_bC account'),
    councilNameCCMarker:council('Example_CC account'),
    councilNameLiteralSubstring:council('Example_central'),
    councilExplicitType:accountModel({name:'Example',organisation_type:'english_local_authority'})==='english_local_authority',
    councilNonMatchingCompanyUnchanged:accountModel({name:'Example Ltd',organisation_type:'uk_limited_company'})==='company',
    councilNonMatchingUnsupportedUnchanged:accountModel({name:'Example Charity',organisation_type:'charity'})===null,
    councilMissingNameUnchanged:accountModel({company_type:'ltd'})==='company',
    councilOnlyNameChecked:accountModel({name:'Example',organisation_type:'charity',company_number:'_cc',public_body_identifier:'council'})===null,
  };
}