import {environmentSupplier} from './aseEnvironmentIdentity.ts';
export function aseAutomationSources(run,model,account) {
  if(run.source_mode==='gazette') return ['gazette'];
  if(model==='english_local_authority') return ['local_authority','council_governance'];
  return ['registry','accounts',...(run.scheduled===true && run.source_mode==='assessment' ? ['gazette'] : []),...(environmentSupplier(account) ? ['environment_agency'] : []),...(run.scheduled===true && run.source_mode==='assessment' ? ['leadership'] : [])];
}
export function overnightSourceRules() {
  const run={scheduled:true,source_mode:'assessment'},company={};
  const companyKeys=aseAutomationSources(run,'company',company);
  return {
    overnightRefreshesCompaniesHouse:companyKeys.includes('registry') && companyKeys.includes('accounts'),
    overnightRefreshesGazette:companyKeys.includes('gazette'),
    overnightRefreshesLeadership:companyKeys.includes('leadership'),
    overnightRefreshesSupplierEnvironment:aseAutomationSources(run,'company',{account_type:'supplier'}).includes('environment_agency'),
    sourcesFitAuditLimit:aseAutomationSources(run,'company',{account_type:'supplier'}).length<=5,
    overnightRefreshesCouncils:aseAutomationSources(run,'english_local_authority',company).join(',')==='local_authority,council_governance',
    daytimeDoesNotCollectGazette:!aseAutomationSources({...run,scheduled:false},'company',company).includes('gazette'),
    legacyGazetteModePreserved:aseAutomationSources({source_mode:'gazette'},'company',company).join(',')==='gazette',
    hmrcRemainsExcluded:!companyKeys.includes('hmrc')
  };
}