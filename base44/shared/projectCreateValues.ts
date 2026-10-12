import { flowSpecs, validateFlowValue, isName } from './dataverseFlowFields.ts';
import { addFlowWriteValue } from './dataverseWritePayload.ts';
import { projectCreateReference } from './projectCreateReferences.ts';
const allowed = ['name','description','client_account_id','estimated_value','procurement_route','site_postcode','construction_term_weeks','riba1_term_weeks','riba2_term_weeks','riba3_term_weeks','riba4_term_weeks','bdm_aad_id','director_aad_id','department_id','client_rep_id','link_to_legals','link_to_project_questionnaire','link_to_pso','link_to_pcs'];
export function projectRequestValues(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Enter the project details.');
  const values = {};
  for (const key of allowed) {
    const value = input[key];
    if (value == null || value === '') continue;
    if (key.endsWith('_id')) {
      if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(value)) throw new Error(`Invalid ${key}.`);
      values[key] = value;
    } else values[key] = validateFlowValue(flowSpecs.projects.fields[key], typeof value === 'string' ? value.trim() : value, key === 'name');
    if (typeof values[key] === 'number' && (values[key] < 0 || values[key] > 1e12)) throw new Error(`Invalid ${key}.`);
    if (key.startsWith('link_to_') && !/^https:\/\//i.test(value)) throw new Error('SharePoint links must use HTTPS.');
  }
  if (!values.name) throw new Error('Enter a project name.');
  return { ...values, live_project: true, approval_status: 'Approval Pending' };
}
export async function projectCreatePayload(base44, context, values) {
  const payload = {};
  for (const [local, initial] of Object.entries(values)) {
    const mapping = context.settings.mappings.find(m => m.local === local);
    if (!mapping || !isName(mapping.source)) throw new Error(`Confirm the Dataverse mapping for ${local.replaceAll('_',' ')} before submitting.`);
    let value = initial;
    if (mapping.type === 'Lookup') value = await projectCreateReference(base44, context, mapping, value);
    else if (['String','Memo'].includes(mapping.type) && typeof value === 'number') value = String(value);
    await addFlowWriteValue(context, { ...mapping, localType: mapping.type === 'Lookup' ? 'Lookup' : mapping.type }, value, payload);
  }
  return payload;
}