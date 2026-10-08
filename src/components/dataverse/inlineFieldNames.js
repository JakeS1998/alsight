const common = {
  'document id': 'document_id', 'warranty id': 'warranty_id', 'type': 'document_type',
  'drafted': 'drafted_date', 'drafting due': 'drafting_due_date', 'drafted date': 'drafted_date',
  'signing target': 'signing_target_date', 'execution date': 'date_of_execution', 'execution': 'date_of_execution',
  'approver': 'approvers_name', 'bsm owner': 'is_bsm_document_owner', 'file': 'link_to_file',
  'file link': 'link_to_file', 'reminder': 'reminder_date', 'loi expiry': 'loi_expiry_date',
  'fee proposal date': 'fee_proposal_date', 'account': 'account_id', 'supplier': 'supplier_id', 'contractor': 'contractor_id'
};
const tables = {
  projects: { 'client': 'client_account_id', 'department': 'department_id', 'construction actual completion': 'practical_completion_date', 'task completion': 'practical_completion_date', 'project postcode': 'site_postcode', 'bdm': 'bdm_aad_id', 'bsm': 'bsm_aad_id', 'director': 'director_aad_id', 'project manager': 'project_manager_id', 'client representative': 'client_rep_id', 'construction term': 'construction_term_weeks', 'ie commencement': 'ie_commencement_date', 'aa executed': 'aa_executed_date', 'pq approval': 'pq_approval_date', 'legals folder': 'link_to_legals', 'project questionnaire': 'link_to_project_questionnaire', 'pso': 'link_to_pso', 'pcs': 'link_to_pcs' },
  contacts: { 'telephone': 'phone', 'mobile': 'mobile_phone', 'organisation': 'company_name' },
  accounts: { 'registered company name': 'company_name', 'incorporated': 'date_of_incorporation' }
};
export default function inlineFieldName(table, label = '') {
  const key = label.toLowerCase().trim();
  return tables[table]?.[key] || common[key] || key.replaceAll(' ', '_');
}