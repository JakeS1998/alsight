export const FRAMEWORK_FEE_KEY = 'uklf-fee-bands';

export const DEFAULT_FRAMEWORK_FEE_BANDS = [
  { min: 0, max: 999999, pct: 0.95 },
  { min: 1000000, max: 1999999, pct: 0.75 },
  { min: 2000000, max: 4999999, pct: 0.5 },
  { min: 5000000, max: 9999999, pct: 0.3 },
  { min: 10000000, max: 14999999, pct: 0.22 },
  { min: 15000000, max: 19999999, pct: 0.2 },
  { min: 20000000, max: 34999999, pct: 0.15 },
  { min: 35000000, max: 0, pct: 0.1 },
];

export const DEFAULT_FRAMEWORK_FEE_LABELS = {
  contingency: 'Contingency',
  uklf: 'UKLF Fee',
};

export async function readFrameworkFeeSettings(entities, version = 'FW3', route = 'dma') {
  const frameworkKey = version === 'FW3' ? FRAMEWORK_FEE_KEY : version === 'FW4' ? `${FRAMEWORK_FEE_KEY}-fw4` : null;
  const key = frameworkKey && route ? (route === 'dma' ? frameworkKey : `${frameworkKey}-${route}`) : null;
  const defaults = { key, version, route, bands: version === 'FW3' && route === 'dma' ? DEFAULT_FRAMEWORK_FEE_BANDS : [], ...DEFAULT_FRAMEWORK_FEE_LABELS };
  if (!key) return defaults;
  const { items } = await entities.FrameworkFeeSettings.filter({ key }, { limit: 1 });
  const row = items[0];
  if (!row) return defaults;
  return {
    key, version, route,
    bands: Array.isArray(row.bands) ? row.bands : defaults.bands,
    contingency: row.contingency_label || DEFAULT_FRAMEWORK_FEE_LABELS.contingency,
    uklf: row.uklf_label || DEFAULT_FRAMEWORK_FEE_LABELS.uklf,
    id: row.id,
  };
}

export function frameworkFeePct(bands, contractValue) {
  const value = Number(contractValue) || 0;
  const sorted = [...bands].sort((a, b) => (Number(a.min) || 0) - (Number(b.min) || 0));
  for (const band of sorted) {
    const min = Number(band.min) || 0;
    const max = Number(band.max) || 0;
    const isTopBand = !max || max <= min;
    if (value >= min && (isTopBand || value <= max)) return Number(band.pct) || 0;
  }
  return 0;
}

export function frameworkFeeAmount(bands, contractValue) {
  const pct = frameworkFeePct(bands, contractValue);
  return Math.round((Number(contractValue) || 0) * pct / 100 * 100) / 100;
}