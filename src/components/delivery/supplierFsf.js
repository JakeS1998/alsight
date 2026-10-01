export const isAlsStaff = user => ['admin', 'director', 'regional_director', 'bdm', 'bsm', 'finance'].includes(user?.role);
export const supplierFsfKey = line => line.fsf_supplier_key || line.supplier_company_number || JSON.stringify([line.description, line.role || 'Supplier']);
export const fsfAmount = (base, pct) => Math.round((Number(base) || 0) * (Number(pct) || 0)) / 100;
export function supplierFsfTotals(lines, rates = {}, contractors = []) {
  const suppliers = new Map();
  lines.forEach(line => {
    const key = supplierFsfKey(line);
    if (!suppliers.has(key)) suppliers.set(key, { key, supplier: line.supplier_company_number || line.description || 'Supplier', base: 0, basis: 'Base fees', pct: Number(rates[key]) || 0 });
    suppliers.get(key).base += Number(line.supplier_fee) || 0;
  });
  contractors.forEach(row => suppliers.set(row.key, { ...row, basis: 'OHP only', pct: Number(rates[row.key]) || 0 }));
  const rows = [...suppliers.values()].map(row => ({ ...row, commission: fsfAmount(row.base, row.pct) }));
  return { rows, total: Math.round(rows.reduce((sum, row) => sum + row.commission, 0) * 100) / 100 };
}