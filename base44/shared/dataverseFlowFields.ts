export const flowSpecs = {
  projects: { entity: 'Project', required: 'name', writeRoles: ['admin', 'director', 'bdm'], fields: {
    name: 'String', project_number: 'String', description: 'Memo', comments: 'Memo', site_postcode: 'String', estimated_value: 'Money', construction_term_weeks: 'Decimal', latitude: 'Double', longitude: 'Double', live_project: 'Boolean', practical_completion_date: 'DateTime', riba1_end: 'DateTime', riba2_end: 'DateTime', riba3_end: 'DateTime', riba4_end: 'DateTime'
  } },
  contacts: { entity: 'Contact', required: 'full_name', writeRoles: ['admin'], fields: {
    full_name: 'String', first_name: 'String', last_name: 'String', email: 'String', email2: 'String', email3: 'String', job_title: 'String', department: 'String', phone: 'String', mobile_phone: 'String', address_line1: 'String', address_city: 'String', address_county: 'String', address_postcode: 'String', address_country: 'String'
  } }
};
export const isGuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export const isName = value => typeof value === 'string' && /^[a-z][a-z0-9_]{0,100}$/.test(value);
export function compatibleType(local, source) {
  return local === source || (['String', 'Memo'].includes(local) && ['String', 'Memo'].includes(source)) || (['Money', 'Decimal', 'Double'].includes(local) && ['Money', 'Decimal', 'Double', 'Integer', 'BigInt'].includes(source));
}
export function validateFlowValue(type, value, required = false) {
  if (value === null || value === '') { if (required) throw new Error('The record name cannot be empty.'); return type === 'String' || type === 'Memo' ? '' : null; }
  if (['String', 'Memo'].includes(type)) { if (typeof value !== 'string' || value.length > (type === 'Memo' ? 4000 : 500)) throw new Error('Text is too long or invalid.'); return value; }
  if (type === 'Boolean') { if (typeof value !== 'boolean') throw new Error('Choose Yes or No.'); return value; }
  if (type === 'DateTime') { if (typeof value !== 'string' || value.length > 40 || !Number.isFinite(Date.parse(value))) throw new Error('Enter a valid date.'); return new Date(value).toISOString(); }
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Enter a valid number.');
  return value;
}