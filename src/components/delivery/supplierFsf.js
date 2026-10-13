export const isAlsStaff = user => ['admin', 'director', 'regional_director', 'bdm', 'bsm', 'finance'].includes(user?.role);
export const supplierFsfKey = line => line.fsf_supplier_key || line.supplier_company_number || JSON.stringify([line.description, line.role || 'Supplier']);
export const fsfAmount = (base, pct) => Math.round((Number(base) || 0) * (Number(pct) || 0)) / 100;
export function supplierFsfTotals(lines, rates = {}, contractors = []) {
  // Delivery-team Contractor entries represent the principal contractor; other supplier fees do not attract FSF.
  const rows = contractors.map(row => ({ ...row, basis: 'Full principal contractor fees including OHP', pct: Number(rates[row.key]) || 0, commission: fsfAmount(row.base, rates[row.key]) }));
  return { rows, total: Math.round(rows.reduce((sum, row) => sum + row.commission, 0) * 100) / 100 };
}