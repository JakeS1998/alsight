import { formatCurrency } from '@/lib/portal';

const stages = ['riba_1', 'riba_2', 'riba_3', 'riba_4', 'riba_5_7'];
const normaliseRole = value => {
  const role = String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return role === 'me' ? 'meengineer' : role;
};

export function designTeamFees(card, deliveryTeam, suppliers) {
  const candidates = deliveryTeam.filter(member => normaliseRole(member.role) === normaliseRole(card.label));
  const companyNumber = card.supplierAccount?.company_number;
  const supplierKeys = new Set(candidates.map(member => member.supplier_company_number || ''));
  const matching = companyNumber
    ? candidates.filter(member => member.supplier_company_number === companyNumber)
    : !card.supplierAccount && supplierKeys.size === 1 ? candidates : [];
  if (!matching.length) return { ...card, details: [...card.details, card.fee != null ? `Appointment fee: ${formatCurrency(card.fee)}` : candidates.length ? 'No unambiguous supplier-and-role fee match in the Delivery Team.' : 'Fee not recorded.'] };
  const fee = matching.reduce((total, member) => total + stages.reduce((sum, stage) => sum + Number(member.fees?.[stage] || 0), 0), 0);
  const supplier = suppliers.find(row => row.company_number === matching[0].supplier_company_number);
  return {
    ...card,
    account: card.account || supplier?.name,
    fee,
    details: [...card.details, `Supplier fee from Delivery Team: ${formatCurrency(fee)} (total across RIBA stages; blank stages count as £0).`],
  };
}