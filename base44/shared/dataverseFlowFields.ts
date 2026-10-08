import { additionalFlowSpecs } from './dataverseFlowCatalog.ts';
import { documentFlowSpec } from './dataverseDocumentFields.ts';
export const flowSpecs = {
  ...additionalFlowSpecs,
  documents: documentFlowSpec,
  projects: { entity: 'Project', label: 'Projects', sourceNames: ['bss_projects', 'bss_project'], required: 'name', matchFields: ['project_number', 'name'], writeRoles: ['admin', 'director', 'bdm'], fields: {
    name: 'String', project_number: 'String', description: 'Memo', comments: 'Memo', site_postcode: 'String', estimated_value: 'Money', construction_term_weeks: 'Decimal', latitude: 'Double', longitude: 'Double', live_project: 'Boolean', practical_completion_date: 'DateTime', riba1_end: 'DateTime', riba2_end: 'DateTime', riba3_end: 'DateTime', riba4_end: 'DateTime',
    why_this_matters: 'Memo', client_name: 'String', procurement_route: 'Boolean', approval_status: 'String', aa_executed_date: 'DateTime', pq_approval_date: 'DateTime', riba1_term_weeks: 'Decimal', riba2_term_weeks: 'Decimal', riba3_term_weeks: 'Decimal', riba4_term_weeks: 'Decimal', riba1_system_date: 'String', riba2_system_date: 'String', riba3_system_date: 'String', riba4_system_date: 'String', riba5_system_date: 'String', link_to_legals: 'String', link_to_project_questionnaire: 'String', link_to_riba4_report: 'String', link_to_pso: 'String', link_to_pcs: 'String', ie_commencement_date: 'DateTime', ie_value: 'Money', ie_comments: 'Memo', insights_and_engagement: 'Boolean', payment_type: 'String', status: 'String',
    client_account_id: 'Lookup', account_id: 'Lookup', department_id: 'Lookup', bdm_aad_id: 'Lookup', bsm_aad_id: 'Lookup', director_aad_id: 'Lookup', strategic_account_manager_aad_id: 'Lookup', project_manager_id: 'Lookup', client_rep_id: 'Lookup', client_rep2_id: 'Lookup', contractor_contact_id: 'Lookup'
  }, enums: { status: ['active', 'inactive'] }, preservedFields: ['impact_themes', 'request_brief_file_uri', 'related_supplier_account_ids'] },
  contacts: { entity: 'Contact', label: 'Contacts', sourceNames: ['contact', 'contacts'], required: 'full_name', matchFields: ['email', 'full_name'], writeRoles: ['admin'], fields: {
    full_name: 'String', first_name: 'String', last_name: 'String', email: 'String', email2: 'String', email3: 'String', job_title: 'String', department: 'String', phone: 'String', mobile_phone: 'String', address_line1: 'String', address_city: 'String', address_county: 'String', address_postcode: 'String', address_country: 'String', company_name: 'String', company_number: 'String', officer_first_name: 'String', officer_last_name: 'String', officer_full_name: 'String', officer_role: 'String', ch_person_number: 'String', officer_appointments_link: 'String', nationality: 'String', appointed_on: 'DateTime', identify_verified: 'Boolean', system_managed: 'Boolean', position: 'String', authority: 'String', status: 'String'
  }, enums: { status: ['active', 'inactive'] }, preservedFields: ['company_logo_uri', 'aad_id', 'portal_role', 'managing_partner_id'] }
};
export const isGuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export const isName = value => typeof value === 'string' && /^[a-z][a-z0-9_]{0,100}$/.test(value);
export function compatibleType(local, source) {
  return local === source || (['String', 'Memo'].includes(local) && ['String', 'Memo', 'Uniqueidentifier', 'Lookup', 'Picklist', 'State', 'Status', 'Boolean'].includes(source)) || (local === 'Lookup' && ['Lookup', 'Uniqueidentifier'].includes(source)) || (['Money', 'Decimal', 'Double'].includes(local) && ['Money', 'Decimal', 'Double', 'Integer', 'BigInt'].includes(source));
}
export function validateFlowValue(type, value, required = false, stringLimit = 500) {
  if (value === null || value === '') { if (required) throw new Error('The record name cannot be empty.'); return ['String', 'Memo', 'Lookup', 'Uniqueidentifier'].includes(type) ? '' : null; }
  if (['String', 'Memo'].includes(type)) { if (typeof value !== 'string' || value.length > (type === 'Memo' ? 4000 : stringLimit)) throw new Error('Text is too long or invalid.'); return value; }
  if (['Lookup', 'Uniqueidentifier'].includes(type)) { if (typeof value !== 'string' || !isGuid(value)) throw new Error('Dataverse returned an invalid reference.'); return value.toLowerCase(); }
  if (type === 'Boolean') { if (typeof value !== 'boolean') throw new Error('Choose Yes or No.'); return value; }
  if (type === 'DateTime') { if (typeof value !== 'string' || value.length > 40 || !Number.isFinite(Date.parse(value))) throw new Error('Enter a valid date.'); return new Date(value).toISOString(); }
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Enter a valid number.');
  return value;
}