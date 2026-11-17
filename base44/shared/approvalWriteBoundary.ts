export function isApprovalMapping(mapping) {
  return [mapping?.local, mapping?.label, mapping?.displayName, mapping?.source, mapping?.queryName].some(value => /approv/i.test(String(value || '')));
}
export function generalFlowMappings(table, mappings = [], role) {
  const protectNumber = table === 'projects' && !['admin','bsm'].includes(role);
  const protectedMapping = mapping => isApprovalMapping(mapping) || (protectNumber && mapping.local === 'project_number');
  const sources = new Set(mappings.filter(protectedMapping).map(mapping => mapping.source).filter(Boolean));
  return mappings.map(mapping => protectedMapping(mapping) || (mapping.source && sources.has(mapping.source)) ? { ...mapping, write: false } : mapping);
}
export function assertGeneralFlowWrite(table, values, mappings = [], role) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) return;
  const allowed = generalFlowMappings(table, mappings, role);
  if (Object.keys(values).some(field => /approv/i.test(field) || (table === 'projects' && field === 'project_number' && !['admin','bsm'].includes(role)) || (mappings.some(mapping => mapping.local === field) && !allowed.some(mapping => mapping.local === field && mapping.write)))) {
    const error = new Error('Approval fields are read-only and can only be updated through the approval process.');
    error.status = 403;
    throw error;
  }
}