export default function isApprovalField(field) {
  const values = typeof field === 'string' ? [field] : [field?.local, field?.label, field?.displayName, field?.source, field?.queryName];
  return values.some(value => /approv/i.test(String(value || '')));
}