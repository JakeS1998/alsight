import { formatCurrency } from '@/lib/portal';

// True when a real number (including 0) is present
export function hasValue(v) {
  return v != null && v !== '' && !isNaN(Number(v));
}

// Numeric value or null (never coerces missing → 0)
export function asNum(v) {
  return hasValue(v) ? Number(v) : null;
}

// £-formatted, or "Not recorded" when no value entered
export function moneyOrNR(v) {
  if (!hasValue(v)) return 'Not recorded';
  return formatCurrency(Number(v));
}

// Signed money for variations (+ prefix)
export function moneySigned(v) {
  if (!hasValue(v)) return 'Not recorded';
  const n = Number(v);
  if (n === 0) return formatCurrency(0);
  return n > 0 ? '+' + formatCurrency(n) : formatCurrency(n);
}

// Percentage string or "Not recorded"
export function pctOrNR(v) {
  if (!hasValue(v)) return 'Not recorded';
  return `${Number(v).toFixed(1)}%`;
}