const normalise = value => String(value || '').trim().toLowerCase();
export default function contractorAppointment({ deliveryTeam = [], suppliers = [], accountMap = {}, legalDocs = [] }) {
  const contractors = deliveryTeam.filter(member => normalise(member.role) === 'contractor' && member.supplier_company_number);
  const accounts = [...suppliers, ...Object.values(accountMap)];
  const selected = accounts.filter(account => contractors.some(member => normalise(member.supplier_company_number) === normalise(account.company_number)));
  const identities = new Set(selected.flatMap(account => [account.id, account.dataverse_id]).filter(Boolean).map(normalise));
  const documents = legalDocs.filter(doc => doc.document_type !== 'jct' && (contractors.length
    ? !!doc.account_id && identities.has(normalise(doc.account_id))
    : doc.document_type === 'pcsa'));
  const document = documents.find(doc => doc.document_type === 'pcsa' && doc.executed === 'yes') || documents.find(doc => doc.executed === 'yes') || documents.find(doc => doc.document_type === 'pcsa') || documents[0];
  const account = document ? selected.find(row => [row.id, row.dataverse_id].some(id => id && normalise(id) === normalise(document.account_id))) : selected[0];
  return { document, account, identified: contractors.length > 0, name: account?.name };
}
export function savedDeliveryTeam(delivery) {
  try { const team = JSON.parse(delivery?.delivery_team || '[]'); return Array.isArray(team) ? team : []; }
  catch { return []; }
}