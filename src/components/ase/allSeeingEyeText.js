export default function allSeeingEyeText(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/Alliance Stability\s*(?:&amp;|&)\s*Exposure(?:\s*·\s*ASE(?:\s*v2)?)?|\bASE(?:\s*v2)?\b|All-Seeing Eye/g, 'All Seeing Eye');
}
const displayFields = new Set(['error','title','label','component_label','reason','explanation','confidence_explanation','notes','note','description','drivers','warnings','blockers','stage','assessment_note','publication_note','selection_reason','automatic_reason']);
export function allSeeingEyeCopy(value, field = '') {
  if (typeof value === 'string') return displayFields.has(field) ? allSeeingEyeText(value) : value;
  if (Array.isArray(value)) return value.map(item => allSeeingEyeCopy(item, field));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key,item]) => [key,allSeeingEyeCopy(item,key)]));
  return value;
}