export const isAlsStaff = user => ['admin', 'director', 'regional_director', 'bdm', 'bsm', 'finance'].includes(user?.role);
export const supplierFsfKey = line => line.fsf_supplier_key || line.supplier_company_number || JSON.stringify([line.description, line.role || 'Supplier']);
export const fsfAmount = (base, pct) => Math.round((Number(base) || 0) * (Number(pct) || 0)) / 100;
const round = value => Math.round(value * 100) / 100;
export const fsfBandLabels = { early: 'RIBA 0–4', late: 'RIBA 5–7', task: 'Task' };
export function supplierFsfTotals(rates = {}, contractors = []) {
  // FSF applies only to principal contractor fees, including OHP in each band.
  const rows = contractors.map(row => {
    const rate = rates[row.key] || {};
    const lateBase = Number(row.stageAmounts?.riba_5_7) || 0;
    const isTask = Object.hasOwn(row.stageAmounts || {}, 'Task');
    const bases = isTask ? { task: row.base } : { early: round(row.base - lateBase), ...(Object.hasOwn(row.stageAmounts || {}, 'riba_5_7') ? { late: lateBase } : {}) };
    const bands = Object.entries(bases).map(([key, base]) => {
      const pct = Number(key === 'late' ? rate.late : rate.early) || 0;
      return { key, base, pct, commission: fsfAmount(base, pct) };
    });
    // The legacy single-rate calculation rounded once across the entire base.
    if (bands.length === 2 && bands[0].pct === bands[1].pct) bands[1].commission = round(fsfAmount(row.base, bands[0].pct) - bands[0].commission);
    return { ...row, bands, commission: round(bands.reduce((sum, band) => sum + band.commission, 0)) };
  });
  return { rows, total: round(rows.reduce((sum, row) => sum + row.commission, 0)) };
}