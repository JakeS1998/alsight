import { flowSpecs, compatibleType } from './dataverseFlowFields.ts';
import { matchFlowChoices } from './dataverseChoiceMatching.ts';
const normalise = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
export function suggestFlowMappings(table, inspected) {
  const spec = flowSpecs[table], used = new Set();
  const aliases = { name: [inspected.primaryName], document_id: [inspected.primaryName], warranty_id: [inspected.primaryName], dataverse_systemuser_id: [inspected.primaryId], staff_aad_id: ['azureactivedirectoryobjectid'], phone: table === 'users' ? ['address1_telephone1'] : ['telephone1'], email: ['emailaddress1'], website: ['websiteurl'], status: ['statecode'], address_line1: ['address1_line1'], address_line2: ['address1_line2'], address_city: ['address1_city'], address_county: ['address1_county'], address_postcode: ['address1_postalcode'], address_country: ['address1_country'] };
  const result = [];
  for (const [local, type] of Object.entries(spec.fields)) {
    if (table === 'projects' && inspected.logicalName === 'bss_project1' && ['name', 'project_number'].includes(local)) continue;
    const compatible = inspected.fields.filter(field => !used.has(field.name) && compatibleType(type, field.type));
    let matches = compatible.filter(field => (aliases[local] || []).includes(field.name));
    if (!matches.length) matches = compatible.filter(field => normalise(field.name.replace(/^[a-z][a-z0-9]*_/, '')) === normalise(local) || normalise(field.label) === normalise(local.replace(/_aad_id$/, '').replace(/_id$/, '')));
    if (matches.length !== 1) continue;
    const source = matches[0];
    const isChoice = ['Picklist', 'State', 'Status'].includes(source.type);
    if (isChoice && !source.options.length) continue;
    const values = isChoice ? matchFlowChoices(source.options, spec.enums?.[local]) : {};
    result.push({ local, source: source.name, write: false, ...(Object.keys(values).length ? { values } : {}) }); used.add(source.name);
  }
  return result;
}