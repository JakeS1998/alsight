const field = (key, label, type = 'text', extra = {}) => ({ key, label, type, ...extra });
export const qualityEditorFields = {
  postcode: [field('site_postcode','Site postcode')],
  bdm: [field('bdm_aad_id','BDM','lookup',{ lookup: 'bdm' })],
  bsm: [field('bsm_aad_id','BSM','lookup',{ lookup: 'bsm' })],
  client: [field('client_account_id','Client account','lookup',{ lookup: 'client' }),field('client_name','Client name')],
  dates: [...[1,2,3,4].map(n => field(`riba${n}_end`,`RIBA ${n} completion`,'date')),field('practical_completion_date','Construction completion','date')],
  dataverse: [field('dataverse_id','Dataverse ID (verified source GUID)')],
  duplicates: [field('full_name','Full name'),field('email','Primary email','email'),field('phone','Phone'),field('job_title','Job title'),field('status','Status','select',{ options: ['active','inactive'] })],
  fees: [field('fee_value','Fee value (£)','number'),field('fee_basis','Fee basis','select',{ options: ['fixed','percentage','day_rate'] }),field('line_items','Fee line items','fee_lines')],
  jct: [field('existing_jct_id','Link an existing JCT (optional)','lookup',{ lookup: 'jct' }),field('document_id','New JCT document reference'),field('form_of_jct','Form of JCT','select',{ options: ['design_and_build','intermediate_with_contractors_design','minor_works'] }),field('executed','Executed','select',{ options: ['no','yes'] }),field('link_to_file','Contract document link','url')]
};
export const qualityEditDescriptions = {
  jct: 'Link an existing JCT or enter a reference to create a linked JCT record. This does not generate or execute a contract.',
  dataverse: 'Only use an ID verified against the source system. Native portal records can legitimately have no Dataverse ID.',
  duplicates: 'Correct this contact or mark it inactive if appropriate. No records are merged or deleted automatically.',
  supplier: 'Update proposal references for the existing delivery team; other team details and fees are retained.'
};