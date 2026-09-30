const br = 'https://www.legislation.gov.uk/uksi/2010/2214/regulation/';
const cdm = 'https://www.legislation.gov.uk/uksi/2015/51/regulation/12';
const info = (key, label, classification, guidance, source, field = undefined) => ({ key, label, classification, statutory: classification !== 'contractual' && classification !== 'project', guidance, source, documentRequired: !['defects','final_account'].includes(key), ...(field ? { field } : {}) });
export const handoverDefinitions = [
  info('pc','Practical Completion certificate','contractual','A JCT-type Practical Completion certificate is contractual; it is not a building-control completion certificate.',''),
  info('om','O&M manuals','statutory_content','The manual is a contractual package containing applicable statutory operating and maintenance information. Check the separate fire, ventilation and energy information requirements; not every manual is a statutory document.',br + '40','om_manuals'),
  info('hs','Health & Safety File','statutory','CDM 2015: required where more than one contractor is involved. The Principal Designer prepares and updates the file (or passes duties to the Principal Contractor where appropriate); it must be handed to the client. A portal safety register alone is not the complete statutory file.',cdm,'hs_file'),
  info('as_builts','As-built drawings','statutory_applicable','Contractual drawings may also be needed for the CDM file, fire-safety information or an applicable higher-risk-building golden thread. Assess the actual information duties, not just the package name.',cdm),
  info('warranties','Warranties','contractual','Collateral warranties arise from appointments, contracts, funder or framework requirements; they are not generally statutory handover documents.','','warranties_status'),
  info('training','Operational training & records','statutory_applicable','Training duties may apply to work equipment under PUWER and other specialist regimes. A generic handover attendance record is not universally statutory; identify equipment and operator duties.','https://www.legislation.gov.uk/uksi/1998/2306/regulation/9','training'),
  info('assets','Asset information','statutory_content','An asset register/COBie package is not universally statutory, but ventilation, fixed-services and any applicable golden-thread information must be provided.',br + '40','asset_info'),
  info('defects','Outstanding defects register','contractual','Contractual and project-management close-out information; completeness does not mean all defects are resolved.',''),
  info('final_account','Final account status','contractual','Commercial/contractual close-out information, not statutory certification. Recording the status does not mean the account is agreed or paid.','','final_account_status'),
  info('building_control','Building Control completion / final certificate','statutory_applicable','Record the certificate appropriate to the building-control route and applicable regime, including BSR certification for higher-risk work. Do not substitute the Practical Completion certificate. Exempt work and transitional arrangements need an authorised assessment.',br + '17'),
  info('compliance_declarations','Building Regulations compliance declarations','statutory_applicable','Record the applicable completion notice and client, Principal Designer and Principal Contractor declarations (or equivalent sole dutyholders). Assess route, exemptions and transitional provisions.',br + '16'),
  info('fire_safety','Regulation 38 Fire Safety Information','statutory_applicable','For relevant erection/extension or material change-of-use work subject to Part B and the Fire Safety Order: provide information to the Responsible Person by completion or earlier occupation where applicable. Record acknowledgement and authority/certifier notification; route-specific notification deadlines apply.',br + '38'),
  info('ventilation','Ventilation operation & maintenance information','statutory_applicable','Regulation 39 applies to relevant ventilation work: provide sufficient operation and maintenance information to the owner. Identify the applicable scope and timing.',br + '39'),
  info('energy_services','Energy / fixed building services information','statutory_applicable','Regulation 40 applies to relevant fuel/power work: provide building and fixed-services operation/maintenance information for reasonable energy efficiency. Check additional generation/overheating duties where applicable.',br + '40'),
  info('epc','Energy Performance Certificate','statutory_applicable','For qualifying construction/conversion work, provide the EPC to the owner and notify the relevant authority under the applicable regulations (normally within five days of completion). Assess exemptions and the work scope.',br + '29'),
];
const f = (key, label, type = 'text', options = undefined) => ({ key, label, type, required: true, ...(options ? { options } : {}) });
const yes = (key, label) => f(key,label,'select',['No','Yes']);
const issued = [f('date_issued','Date issued','date'),f('document_reference','Document reference')];
const transfer = (label) => [yes('provided','Provided to recipient'),f('recipient_id',label,'contact'),...issued];
export const complianceFields = {
  hs: transfer('Client recipient (Contact)'),
  building_control: [f('issuer','Building-control authority / approver / BSR'),...issued],
  compliance_declarations: [yes('client_declaration','Client declaration recorded'),yes('designer_declaration','Principal Designer / sole designer declaration recorded'),yes('contractor_declaration','Principal Contractor / sole contractor declaration recorded'),yes('submitted','Completion notice and declarations submitted'),...issued],
  fire_safety: [...transfer('Responsible Person (Contact)'),f('acknowledgement','Acknowledgement / sufficiency evidence reference'),yes('authority_notified','Relevant authority / certifier notified'),f('notification_date','Notification date','date')],
  ventilation: transfer('Owner recipient (Contact)'),
  energy_services: transfer('Owner recipient (Contact)'),
  epc: [...transfer('Owner recipient (Contact)'),yes('authority_notified','Relevant authority notified'),f('notification_date','Notification date','date')],
};
export function complianceGaps(key, values = {}) {
  const details = values ?? {};
  return (complianceFields[key] || []).filter(field => !String(details[field.key] || '').trim() || (field.type === 'select' && details[field.key] !== 'Yes')).map(field => field.label);
}
export function cleanComplianceDetails(key, input) {
  if (!complianceFields[key] || !input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Choose a supported statutory information record.');
  return Object.fromEntries(complianceFields[key].map(field => {
    const value = input[field.key] ?? '';
    if (typeof value !== 'string' || value.length > 1000) throw new Error(`Enter ${field.label} within 1000 characters.`);
    const text = value.trim();
    if (text && field.type === 'select' && !field.options.includes(text)) throw new Error(`Choose ${field.label}.`);
    if (text && field.type === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(text) || new Date(text+'T00:00:00Z').toISOString().slice(0,10) !== text || text > new Date().toISOString().slice(0,10))) throw new Error(`Enter an actual, non-future ${field.label}.`);
    return [field.key,text];
  }));
}