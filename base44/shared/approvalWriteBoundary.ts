const tables = ['documents', 'dma', 'warranties'];
const fields = ['approval_status', 'approvers_name', 'approval_comments', 'approval_date'];
export function generalFlowMappings(table, mappings = []) {
  const protectedFields=table==='projects' ? ['approval_status','project_number'] : fields;
  if (!tables.includes(table) && table!=='projects') return mappings;
  const sources = new Set(mappings.filter(mapping => protectedFields.includes(mapping.local)).map(mapping => mapping.source));
  return mappings.map(mapping => protectedFields.includes(mapping.local) || sources.has(mapping.source) ? { ...mapping, write: false } : mapping);
}
export function assertGeneralFlowWrite(table, values, mappings = []) {
  if ((!tables.includes(table) && table!=='projects') || !values || typeof values !== 'object' || Array.isArray(values)) return;
  const protectedFields=table==='projects' ? ['approval_status','project_number'] : fields;
  const allowed = generalFlowMappings(table, mappings);
  if (Object.keys(values).some(field => protectedFields.includes(field) || (mappings.some(mapping => mapping.local === field && mapping.write) && !allowed.some(mapping => mapping.local === field && mapping.write)))) {
    const error = new Error('Approval status, approver, comments and date can only be updated through the approval process.');
    error.status = 403;
    throw error;
  }
}