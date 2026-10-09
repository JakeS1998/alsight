const tables = ['documents', 'dma', 'warranties'];
const fields = ['approval_status', 'approvers_name', 'approval_comments', 'approval_date'];
export function generalFlowMappings(table, mappings = []) {
  if (!tables.includes(table)) return mappings;
  const sources = new Set(mappings.filter(mapping => fields.includes(mapping.local)).map(mapping => mapping.source));
  return mappings.map(mapping => fields.includes(mapping.local) || sources.has(mapping.source) ? { ...mapping, write: false } : mapping);
}
export function assertGeneralFlowWrite(table, values, mappings = []) {
  if (!tables.includes(table) || !values || typeof values !== 'object' || Array.isArray(values)) return;
  const allowed = generalFlowMappings(table, mappings);
  if (Object.keys(values).some(field => fields.includes(field) || (mappings.some(mapping => mapping.local === field && mapping.write) && !allowed.some(mapping => mapping.local === field && mapping.write)))) {
    const error = new Error('Approval status, approver, comments and date can only be updated through the approval process.');
    error.status = 403;
    throw error;
  }
}